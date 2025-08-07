import { PrismaClient } from '@prisma/client';

import { cache, CacheUtils } from './cache';
import { HealthLogger, logger } from './logger';

// Metrics interfaces
export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags: Record<string, string>;
}

export interface BusinessMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  totalBookings: number;
  monthlyBookings: number;
  averageBookingValue: number;
  conversionRate: number;
  popularServices: Array<{
    id: string;
    name: string;
    bookingCount: number;
    revenue: number;
  }>;
  clientMetrics: {
    totalClients: number;
    newClientsThisMonth: number;
    returningClientsRate: number;
    averageClientValue: number;
  };
}

export interface SystemMetrics {
  requestsPerMinute: number;
  responseTimeAvg: number;
  errorRate: number;
  cacheHitRate: number;
  databaseConnectionCount: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
}

export interface AnalyticsData {
  period: 'day' | 'week' | 'month' | 'year';
  businessMetrics: BusinessMetrics;
  systemMetrics: SystemMetrics;
  trends: {
    bookingsTrend: Array<{ date: string; count: number; revenue: number }>;
    clientsTrend: Array<{ date: string; newClients: number; returningClients: number }>;
    serviceTrend: Array<{ date: string; serviceId: string; bookings: number }>;
  };
}

// Metrics collector service
export class MetricsCollector {
  private prisma: PrismaClient;
  private metrics: Map<string, Metric[]>;
  private readonly METRICS_RETENTION = 24 * 60 * 60 * 1000; // 24 hours

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.metrics = new Map();
    
    // Clean up old metrics every hour
    setInterval(() => this.cleanupOldMetrics(), 60 * 60 * 1000);
  }

  // Record a metric
  recordMetric(
    name: string,
    value: number,
    unit: string = 'count',
    tags: Record<string, string> = {}
  ): void {
    const metric: Metric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags,
    };

    const key = `${name}_${JSON.stringify(tags)}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    this.metrics.get(key)!.push(metric);

    // Log metric for external monitoring
    HealthLogger.logMetric(name, value, unit, tags);
  }

  // Get business metrics
  async getBusinessMetrics(
    userId: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<BusinessMetrics> {
    const cacheKey = `business_metrics:${userId}:${period}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    // Parallel queries for performance
    const [
      totalRevenueResult,
      periodRevenueResult,
      totalBookingsResult,
      periodBookingsResult,
      popularServicesResult,
      clientMetricsResults,
    ] = await Promise.all([
      // Total revenue
      this.prisma.booking.aggregate({
        where: {
          userId,
          paymentStatus: 'PAID',
        },
        _sum: {
          amount: true,
        },
      }),
      
      // Period revenue
      this.prisma.booking.aggregate({
        where: {
          userId,
          paymentStatus: 'PAID',
          createdAt: {
            gte: startDate,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      
      // Total bookings
      this.prisma.booking.count({
        where: {
          userId,
        },
      }),
      
      // Period bookings
      this.prisma.booking.count({
        where: {
          userId,
          createdAt: {
            gte: startDate,
          },
        },
      }),
      
      // Popular services
      this.prisma.booking.groupBy({
        by: ['serviceId'],
        where: {
          userId,
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          serviceId: true,
        },
        _sum: {
          amount: true,
        },
        orderBy: {
          _count: {
            serviceId: 'desc',
          },
        },
        take: 10,
      }),
      
      // Client metrics queries
      Promise.all([
        // Total unique clients
        this.prisma.booking.findMany({
          where: {
            userId,
          },
          select: {
            clientEmail: true,
          },
          distinct: ['clientEmail'],
        }),
        
        // New clients this period
        this.prisma.booking.findMany({
          where: {
            userId,
            createdAt: {
              gte: startDate,
            },
          },
          select: {
            clientEmail: true,
            createdAt: true,
          },
        }),
        
        // Client lifetime values
        this.prisma.booking.groupBy({
          by: ['clientEmail'],
          where: {
            userId,
            paymentStatus: 'PAID',
          },
          _sum: {
            amount: true,
          },
          _count: {
            clientEmail: true,
          },
        }),
      ]),
    ]);

    // Calculate derived metrics
    const totalRevenue = totalRevenueResult._sum.amount || 0;
    const monthlyRevenue = periodRevenueResult._sum.amount || 0;
    const totalBookings = totalBookingsResult;
    const monthlyBookings = periodBookingsResult;
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Popular services with service details
    const serviceIds = popularServicesResult.map(s => s.serviceId);
    const services = await this.prisma.service.findMany({
      where: {
        id: {
          in: serviceIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const popularServices = popularServicesResult.map(result => {
      const service = services.find(s => s.id === result.serviceId);
      return {
        id: result.serviceId,
        name: service?.name || 'Service inconnu',
        bookingCount: result._count.serviceId,
        revenue: result._sum.amount || 0,
      };
    });

    // Client metrics calculations
    const [uniqueClients, newClientsData, clientLTVData] = clientMetricsResults;
    
    const totalClients = uniqueClients.length;
    const newClientsThisMonth = new Set(newClientsData.map(b => b.clientEmail)).size;
    
    // Calculate returning clients rate
    const returningClients = clientLTVData.filter(client => client._count.clientEmail > 1).length;
    const returningClientsRate = totalClients > 0 ? returningClients / totalClients : 0;
    
    const averageClientValue = clientLTVData.length > 0 
      ? clientLTVData.reduce((sum, client) => sum + (client._sum.amount || 0), 0) / clientLTVData.length
      : 0;

    // Estimate conversion rate (simplified - bookings/website visits would be more accurate)
    const conversionRate = 0.15; // Placeholder - implement with actual website analytics

    const businessMetrics: BusinessMetrics = {
      totalRevenue,
      monthlyRevenue,
      totalBookings,
      monthlyBookings,
      averageBookingValue,
      conversionRate,
      popularServices,
      clientMetrics: {
        totalClients,
        newClientsThisMonth,
        returningClientsRate,
        averageClientValue,
      },
    };

    // Cache for 15 minutes
    await cache.set(cacheKey, JSON.stringify(businessMetrics), 15 * 60);

    return businessMetrics;
  }

  // Get system metrics
  async getSystemMetrics(): Promise<SystemMetrics> {
    const cacheKey = 'system_metrics';
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Collect system metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = this.calculateCpuUsage();
    
    // Get cached metrics
    const cacheStats = await CacheUtils.getStats();
    const cacheHitRate = cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0;

    // Get recent metrics from our stored metrics
    const requestMetrics = this.getRecentMetrics('http_request', 60000); // Last minute
    const responseTimeMetrics = this.getRecentMetrics('response_time', 60000);
    const errorMetrics = this.getRecentMetrics('http_error', 60000);

    const requestsPerMinute = requestMetrics.length;
    const responseTimeAvg = responseTimeMetrics.length > 0 
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
      : 0;
    const errorRate = requestsPerMinute > 0 ? errorMetrics.length / requestsPerMinute : 0;

    // Database connection count (simplified)
    const databaseConnectionCount = 10; // Placeholder - get from connection pool

    const systemMetrics: SystemMetrics = {
      requestsPerMinute,
      responseTimeAvg,
      errorRate,
      cacheHitRate,
      databaseConnectionCount,
      memoryUsage,
      cpuUsage,
    };

    // Cache for 1 minute
    await cache.set(cacheKey, JSON.stringify(systemMetrics), 60);

    return systemMetrics;
  }

  // Get comprehensive analytics data
  async getAnalyticsData(
    userId: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<AnalyticsData> {
    const cacheKey = `analytics:${userId}:${period}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const [businessMetrics, systemMetrics, trends] = await Promise.all([
      this.getBusinessMetrics(userId, period),
      this.getSystemMetrics(),
      this.getTrends(userId, period),
    ]);

    const analyticsData: AnalyticsData = {
      period,
      businessMetrics,
      systemMetrics,
      trends,
    };

    // Cache for 10 minutes
    await cache.set(cacheKey, JSON.stringify(analyticsData), 10 * 60);

    return analyticsData;
  }

  // Get trend data
  private async getTrends(
    userId: string,
    period: 'day' | 'week' | 'month' | 'year'
  ) {
    const now = new Date();
    let startDate: Date;
    let groupBy: 'hour' | 'day' | 'week' | 'month';

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        groupBy = 'hour';
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        groupBy = 'month';
        break;
    }

    // Bookings trend
    const bookingsTrend = await this.getBookingsTrend(userId, startDate, groupBy);
    
    // Clients trend (simplified)
    const clientsTrend = await this.getClientsTrend(userId, startDate, groupBy);
    
    // Service trend
    const serviceTrend = await this.getServiceTrend(userId, startDate, groupBy);

    return {
      bookingsTrend,
      clientsTrend,
      serviceTrend: serviceTrend.slice(0, 5), // Top 5 services only
    };
  }

  private async getBookingsTrend(
    userId: string,
    startDate: Date,
    groupBy: 'hour' | 'day' | 'week' | 'month'
  ) {
    // This is a simplified implementation
    // In production, you'd use SQL with DATE_TRUNC or similar
    const bookings = await this.prisma.booking.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        amount: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group bookings by period
    const grouped = new Map<string, { count: number; revenue: number }>();
    
    bookings.forEach(booking => {
      let key: string;
      const date = booking.createdAt;
      
      switch (groupBy) {
        case 'hour':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!grouped.has(key)) {
        grouped.set(key, { count: 0, revenue: 0 });
      }
      
      const entry = grouped.get(key)!;
      entry.count += 1;
      entry.revenue += booking.amount || 0;
    });

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      revenue: data.revenue,
    }));
  }

  private async getClientsTrend(
    userId: string,
    startDate: Date,
    groupBy: 'hour' | 'day' | 'week' | 'month'
  ) {
    // Simplified implementation
    const bookings = await this.prisma.booking.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        clientEmail: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Track first-time vs returning clients
    const allTimeClients = new Set();
    const existingBookings = await this.prisma.booking.findMany({
      where: {
        userId,
        createdAt: {
          lt: startDate,
        },
      },
      select: {
        clientEmail: true,
      },
    });

    existingBookings.forEach(booking => {
      allTimeClients.add(booking.clientEmail);
    });

    const grouped = new Map<string, { newClients: Set<string>; returningClients: Set<string> }>();

    bookings.forEach(booking => {
      let key: string;
      const date = booking.createdAt;
      
      switch (groupBy) {
        case 'hour':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!grouped.has(key)) {
        grouped.set(key, { newClients: new Set(), returningClients: new Set() });
      }
      
      const entry = grouped.get(key)!;
      
      if (allTimeClients.has(booking.clientEmail)) {
        entry.returningClients.add(booking.clientEmail);
      } else {
        entry.newClients.add(booking.clientEmail);
        allTimeClients.add(booking.clientEmail);
      }
    });

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      newClients: data.newClients.size,
      returningClients: data.returningClients.size,
    }));
  }

  private async getServiceTrend(
    userId: string,
    startDate: Date,
    groupBy: 'hour' | 'day' | 'week' | 'month'
  ) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        serviceId: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const grouped = new Map<string, Map<string, number>>();

    bookings.forEach(booking => {
      let key: string;
      const date = booking.createdAt;
      
      switch (groupBy) {
        case 'hour':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!grouped.has(key)) {
        grouped.set(key, new Map());
      }
      
      const dayMap = grouped.get(key)!;
      dayMap.set(booking.serviceId, (dayMap.get(booking.serviceId) || 0) + 1);
    });

    // Flatten and get most popular services
    const result: Array<{ date: string; serviceId: string; bookings: number }> = [];
    
    grouped.forEach((services, date) => {
      services.forEach((count, serviceId) => {
        result.push({ date, serviceId, bookings: count });
      });
    });

    return result.sort((a, b) => b.bookings - a.bookings);
  }

  // Utility methods
  private getRecentMetrics(metricName: string, timeWindow: number): Metric[] {
    const cutoff = Date.now() - timeWindow;
    const allMetrics: Metric[] = [];

    this.metrics.forEach((metrics, key) => {
      if (key.startsWith(metricName)) {
        const recentMetrics = metrics.filter(m => 
          new Date(m.timestamp).getTime() > cutoff
        );
        allMetrics.push(...recentMetrics);
      }
    });

    return allMetrics;
  }

  private calculateCpuUsage(): number {
    // Simplified CPU usage calculation
    // In production, use proper system monitoring
    const usage = process.cpuUsage();
    return Math.round((usage.user + usage.system) / 10000);
  }

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.METRICS_RETENTION;
    
    this.metrics.forEach((metrics, key) => {
      const filteredMetrics = metrics.filter(m => 
        new Date(m.timestamp).getTime() > cutoff
      );
      
      if (filteredMetrics.length === 0) {
        this.metrics.delete(key);
      } else {
        this.metrics.set(key, filteredMetrics);
      }
    });

    logger.debug('Cleaned up old metrics', {
      remainingKeys: this.metrics.size,
      cutoffTime: new Date(cutoff).toISOString(),
    });
  }
}

// Singleton instance
let metricsCollector: MetricsCollector | null = null;

export function getMetricsCollector(prisma: PrismaClient): MetricsCollector {
  if (!metricsCollector) {
    metricsCollector = new MetricsCollector(prisma);
  }
  return metricsCollector;
}

// Middleware for automatic request metrics
export function recordRequestMetric(
  method: string,
  path: string,
  statusCode: number,
  responseTime: number,
  userId?: string
): void {
  const collector = getMetricsCollector(new PrismaClient());
  
  collector.recordMetric('http_request', 1, 'count', {
    method,
    path,
    status: statusCode.toString(),
    userId: userId || 'anonymous',
  });
  
  collector.recordMetric('response_time', responseTime, 'ms', {
    method,
    path,
    userId: userId || 'anonymous',
  });

  if (statusCode >= 400) {
    collector.recordMetric('http_error', 1, 'count', {
      method,
      path,
      status: statusCode.toString(),
      userId: userId || 'anonymous',
    });
  }
}

// Export utilities
export const MetricsUtils = {
  formatBytes: (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
  },

  formatPercentage: (value: number): string => {
    return `${Math.round(value * 100)}%`;
  },

  formatCurrency: (amount: number, currency = '€'): string => {
    return `${amount.toFixed(2)} ${currency}`;
  },

  formatNumber: (num: number): string => {
    return new Intl.NumberFormat('fr-FR').format(num);
  },
};