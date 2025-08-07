import { User, Service, Booking, Client } from '@prisma/client';

// Dashboard-specific types
export interface DashboardMetrics {
  bookings: BookingMetrics;
  revenue: RevenueMetrics;
  clients: ClientMetrics;
  services: ServiceMetrics;
  performance: PerformanceMetrics;
}

export interface BookingMetrics {
  total: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
  byStatus: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  upcomingCount: number;
  todayCount: number;
}

export interface RevenueMetrics {
  total: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
  averagePerBooking: number;
  projectedMonth: number;
  topServices: Array<{
    service: Pick<Service, 'id' | 'name' | 'price'>;
    revenue: number;
    bookingCount: number;
  }>;
}

export interface ClientMetrics {
  total: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
  returning: number;
  returningRate: number;
  topClients: Array<{
    client: Pick<Client, 'id' | 'name' | 'email'>;
    bookingCount: number;
    totalSpent: number;
    lastBooking: Date;
  }>;
}

export interface ServiceMetrics {
  total: number;
  active: number;
  inactive: number;
  mostPopular: Array<{
    service: Pick<Service, 'id' | 'name' | 'duration' | 'price'>;
    bookingCount: number;
    revenue: number;
  }>;
  leastPopular: Array<{
    service: Pick<Service, 'id' | 'name'>;
    bookingCount: number;
  }>;
  averagePrice: number;
  averageDuration: number;
}

export interface PerformanceMetrics {
  utilizationRate: number; // Percentage of available time slots booked
  cancellationRate: number;
  noShowRate: number;
  averageBookingLead: number; // Days between booking and appointment
  peakHours: Array<{
    hour: number;
    bookingCount: number;
  }>;
  peakDays: Array<{
    dayOfWeek: number;
    bookingCount: number;
  }>;
}

// Sector-specific data
export interface SectorData {
  sector: SectorType;
  metrics: DashboardMetrics;
  benchmarks: SectorBenchmarks;
  recommendations: SectorRecommendation[];
  trends: SectorTrend[];
}

export type SectorType = 
  | 'healthcare' 
  | 'beauty' 
  | 'fitness' 
  | 'education' 
  | 'consulting' 
  | 'legal' 
  | 'automotive' 
  | 'home_services' 
  | 'professional_services' 
  | 'other';

export interface SectorBenchmarks {
  averageBookingValue: number;
  utilizationRate: number;
  cancellationRate: number;
  clientRetentionRate: number;
  monthlyGrowthRate: number;
}

export interface SectorRecommendation {
  id: string;
  type: 'pricing' | 'scheduling' | 'marketing' | 'service' | 'operational';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  actionUrl?: string;
}

export interface SectorTrend {
  period: string;
  metric: string;
  value: number;
  change: number;
  benchmark: number;
}

// Time-based filtering
export type TimeFrame = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface TimeRangeFilter {
  timeframe: TimeFrame;
  startDate?: Date;
  endDate?: Date;
}

// Chart data types
export interface ChartDataPoint {
  label: string;
  value: number;
  change?: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface BookingChartData {
  daily: TimeSeriesData[];
  weekly: TimeSeriesData[];
  monthly: TimeSeriesData[];
  byStatus: ChartDataPoint[];
  byService: ChartDataPoint[];
}

export interface RevenueChartData {
  daily: TimeSeriesData[];
  weekly: TimeSeriesData[];
  monthly: TimeSeriesData[];
  byService: ChartDataPoint[];
  projected: TimeSeriesData[];
}

// Dashboard component props
export interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentType<any>;
  loading?: boolean;
  error?: string;
}

export interface MetricCardProps extends DashboardCardProps {
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  children?: React.ReactNode;
}

export interface ChartCardProps {
  title: string;
  description?: string;
  data: ChartDataPoint[] | TimeSeriesData[];
  type: 'line' | 'bar' | 'pie' | 'area';
  timeframe?: TimeFrame;
  onTimeframeChange?: (timeframe: TimeFrame) => void;
  loading?: boolean;
  error?: string;
}

// Analytics and reporting
export interface AnalyticsFilter {
  dateRange: TimeRangeFilter;
  serviceIds?: string[];
  clientIds?: string[];
  status?: Array<'pending' | 'confirmed' | 'completed' | 'cancelled'>;
  sector?: SectorType;
}

export interface AnalyticsReport {
  filter: AnalyticsFilter;
  summary: DashboardMetrics;
  charts: {
    bookings: BookingChartData;
    revenue: RevenueChartData;
  };
  insights: AnalyticsInsight[];
  exportUrl?: string;
}

export interface AnalyticsInsight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  value?: number;
  change?: number;
  recommendation?: string;
}

// Quick actions and widgets
export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  action: () => void;
  disabled?: boolean;
  badge?: string | number;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'list' | 'action';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  data?: any;
  config?: Record<string, any>;
  visible: boolean;
}

// Dashboard layout and customization
export interface DashboardLayout {
  widgets: DashboardWidget[];
  columns: number;
  compactMode: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface DashboardPreferences {
  layout: DashboardLayout;
  defaultTimeframe: TimeFrame;
  notifications: {
    newBooking: boolean;
    cancellation: boolean;
    lowUtilization: boolean;
    highRevenue: boolean;
  };
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
}