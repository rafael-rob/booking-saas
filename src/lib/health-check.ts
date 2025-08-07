import { PrismaClient } from '@prisma/client';

import { cache, CacheUtils } from './cache';
import { HealthLogger } from './logger';
import { env, features } from './env';

// Health check interfaces
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  details?: Record<string, any>;
  error?: string;
}

export interface DetailedHealthStatus extends HealthStatus {
  services: ServiceHealth[];
  system: {
    memory: NodeJS.MemoryUsage;
    cpu: number;
    platform: string;
    nodeVersion: string;
  };
}

// Health check service
export class HealthCheckService {
  private prisma: PrismaClient;
  private startTime: number;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.startTime = Date.now();
  }

  // Basic health check (fast)
  async getBasicHealth(): Promise<HealthStatus> {
    const status: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: env.NODE_ENV,
    };

    return status;
  }

  // Detailed health check (includes all services)
  async getDetailedHealth(): Promise<DetailedHealthStatus> {
    const basic = await this.getBasicHealth();
    
    // Run all service checks in parallel
    const serviceChecks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkCache(),
      this.checkExternalServices(),
    ]);

    const services: ServiceHealth[] = serviceChecks
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return Array.isArray(result.value) ? result.value : [result.value];
        }
        
        const serviceName = ['database', 'cache', 'external'][index];
        return [{
          name: serviceName,
          status: 'unhealthy' as const,
          responseTime: 0,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        }];
      })
      .flat();

    // Determine overall status
    const hasUnhealthy = services.some(s => s.status === 'unhealthy');
    const hasDegraded = services.some(s => s.status === 'degraded');
    
    const overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 
      hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

    // System information
    const system = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
    };

    const detailedStatus: DetailedHealthStatus = {
      ...basic,
      status: overallStatus,
      services,
      system: {
        ...system,
        cpu: this.calculateCpuUsage(),
      },
    };

    // Log the health check
    HealthLogger.logHealthCheck('overall', overallStatus, undefined, {
      serviceCount: services.length,
      unhealthyServices: services.filter(s => s.status === 'unhealthy').length,
    });

    return detailedStatus;
  }

  // Database health check
  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Simple query to check database connectivity
      await this.prisma.$queryRaw`SELECT 1 as health_check`;
      
      // Check connection pool status if available
      const responseTime = Date.now() - startTime;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      const details: Record<string, any> = {
        responseTime,
      };

      // Consider degraded if response time > 1s
      if (responseTime > 1000) {
        status = 'degraded';
        details.reason = 'Slow response time';
      }

      // Check for connection pool info if available
      try {
        const connectionInfo = await this.prisma.$queryRaw`
          SELECT 
            count(*) as total_connections,
            count(*) FILTER (WHERE state = 'active') as active_connections
          FROM pg_stat_activity 
          WHERE datname = current_database()
        ` as any[];
        
        if (connectionInfo && connectionInfo[0]) {
          details.connections = connectionInfo[0];
        }
      } catch (error) {
        // Connection info query failed, but main health check passed
        details.connectionInfoError = 'Could not retrieve connection info';
      }

      const result: ServiceHealth = {
        name: 'database',
        status,
        responseTime,
        details,
      };

      HealthLogger.logHealthCheck('database', status, responseTime, details);
      
      return result;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      
      HealthLogger.logHealthCheck('database', 'unhealthy', responseTime, {
        error: errorMessage,
      });
      
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime,
        error: errorMessage,
      };
    }
  }

  // Cache health check
  private async checkCache(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const cacheHealth = await CacheUtils.healthCheck();
      const responseTime = cacheHealth.latency || (Date.now() - startTime);
      
      const status = cacheHealth.status === 'healthy' ? 'healthy' : 'degraded';
      
      const result: ServiceHealth = {
        name: 'cache',
        status,
        responseTime,
        details: {
          backend: features.rateLimit ? 'redis' : 'memory',
          latency: cacheHealth.latency,
        },
      };

      HealthLogger.logHealthCheck('cache', status, responseTime, result.details);
      
      return result;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown cache error';
      
      HealthLogger.logHealthCheck('cache', 'unhealthy', responseTime, {
        error: errorMessage,
      });
      
      return {
        name: 'cache',
        status: 'unhealthy',
        responseTime,
        error: errorMessage,
      };
    }
  }

  // External services health check
  private async checkExternalServices(): Promise<ServiceHealth[]> {
    const services: ServiceHealth[] = [];
    
    // Check Stripe if configured
    if (env.STRIPE_SECRET_KEY) {
      services.push(await this.checkStripe());
    }
    
    // Check email service if configured
    if (features.email) {
      services.push(await this.checkEmailService());
    }
    
    // Check SMS service if configured
    if (features.sms) {
      services.push(await this.checkSmsService());
    }
    
    return services;
  }

  // Stripe health check
  private async checkStripe(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Simple balance retrieve to check Stripe connectivity
      const stripe = (await import('stripe')).default;
      const stripeClient = new stripe(env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-11-20.acacia',
      });
      
      await stripeClient.balance.retrieve();
      
      const responseTime = Date.now() - startTime;
      
      HealthLogger.logHealthCheck('stripe', 'healthy', responseTime);
      
      return {
        name: 'stripe',
        status: 'healthy',
        responseTime,
        details: {
          apiVersion: '2024-11-20.acacia',
        },
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown Stripe error';
      
      HealthLogger.logHealthCheck('stripe', 'unhealthy', responseTime, {
        error: errorMessage,
      });
      
      return {
        name: 'stripe',
        status: 'unhealthy',
        responseTime,
        error: errorMessage,
      };
    }
  }

  // Email service health check
  private async checkEmailService(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // For SMTP, we'll do a simple connection test
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransporter({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
      });
      
      await transporter.verify();
      
      const responseTime = Date.now() - startTime;
      
      HealthLogger.logHealthCheck('email', 'healthy', responseTime);
      
      return {
        name: 'email',
        status: 'healthy',
        responseTime,
        details: {
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
        },
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown email error';
      
      HealthLogger.logHealthCheck('email', 'unhealthy', responseTime, {
        error: errorMessage,
      });
      
      return {
        name: 'email',
        status: 'unhealthy',
        responseTime,
        error: errorMessage,
      };
    }
  }

  // SMS service health check
  private async checkSmsService(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // For Twilio, check account status
      const twilio = (await import('twilio')).default;
      const client = twilio(env.TWILIO_ACCOUNT_SID!, env.TWILIO_AUTH_TOKEN!);
      
      await client.api.accounts(env.TWILIO_ACCOUNT_SID!).fetch();
      
      const responseTime = Date.now() - startTime;
      
      HealthLogger.logHealthCheck('sms', 'healthy', responseTime);
      
      return {
        name: 'sms',
        status: 'healthy',
        responseTime,
        details: {
          accountSid: env.TWILIO_ACCOUNT_SID,
        },
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown SMS error';
      
      HealthLogger.logHealthCheck('sms', 'unhealthy', responseTime, {
        error: errorMessage,
      });
      
      return {
        name: 'sms',
        status: 'unhealthy',
        responseTime,
        error: errorMessage,
      };
    }
  }

  // Calculate CPU usage percentage
  private calculateCpuUsage(): number {
    try {
      const startUsage = process.cpuUsage();
      const startTime = Date.now();
      
      // Simple approximation - in a real app you'd want to track this over time
      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const elapsedTime = Date.now() - startTime;
        const cpuPercent = (currentUsage.user + currentUsage.system) / 1000 / elapsedTime * 100;
        return Math.min(100, Math.max(0, cpuPercent));
      }, 100);
      
      return 0; // Placeholder
    } catch (error) {
      return 0;
    }
  }

  // Readiness check (for Kubernetes, etc.)
  async getReadiness(): Promise<{ ready: boolean; details: string[] }> {
    const details: string[] = [];
    let ready = true;
    
    try {
      // Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      ready = false;
      details.push('Database not ready');
    }
    
    try {
      // Check cache
      const cacheHealth = await CacheUtils.healthCheck();
      if (cacheHealth.status !== 'healthy') {
        details.push('Cache not optimal');
        // Don't mark as not ready for cache issues
      }
    } catch (error) {
      details.push('Cache check failed');
    }
    
    return { ready, details };
  }

  // Liveness check (for Kubernetes, etc.)
  async getLiveness(): Promise<{ alive: boolean }> {
    // Basic liveness - if we can respond, we're alive
    return { alive: true };
  }
}

// Singleton instance
let healthCheckService: HealthCheckService | null = null;

export function getHealthCheckService(prisma: PrismaClient): HealthCheckService {
  if (!healthCheckService) {
    healthCheckService = new HealthCheckService(prisma);
  }
  return healthCheckService;
}

// Export health check utilities
export const HealthUtils = {
  // Format uptime in human readable format
  formatUptime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  },
  
  // Format memory usage
  formatMemory(bytes: number): string {
    const mb = bytes / 1024 / 1024;
    return `${Math.round(mb * 100) / 100} MB`;
  },
  
  // Get status color for UI
  getStatusColor(status: 'healthy' | 'degraded' | 'unhealthy'): string {
    switch (status) {
      case 'healthy': return 'green';
      case 'degraded': return 'yellow';
      case 'unhealthy': return 'red';
      default: return 'gray';
    }
  },
};