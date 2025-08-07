import { User, Service, Booking, Client, Availability } from '@prisma/client';

// Base types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: Record<string, any>;
}

// Service layer types
export interface CreateServiceData {
  name: string;
  description?: string;
  duration: number;
  price: number;
  isActive?: boolean;
}

export interface UpdateServiceData extends Partial<CreateServiceData> {}

export interface ServiceWithStats extends Service {
  _count: {
    bookings: number;
  };
  revenue?: number;
}

// Booking layer types
export interface CreateBookingData {
  serviceId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
}

export interface UpdateBookingData {
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface BookingWithRelations extends Booking {
  service: Service;
  client?: Client;
  user: Pick<User, 'id' | 'name' | 'businessName'>;
}

// Client layer types
export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {}

export interface ClientWithStats extends Client {
  _count: {
    bookings: number;
  };
  totalSpent: number;
}

// User layer types
export interface CreateUserData {
  email: string;
  name: string;
  businessName?: string;
  phone?: string;
  password: string;
}

export interface UpdateUserData {
  name?: string;
  businessName?: string;
  phone?: string;
  image?: string;
}

export interface UserProfile extends Omit<User, 'password'> {
  _count: {
    services: number;
    bookings: number;
    clients: number;
  };
}

// Availability types
export interface CreateAvailabilityData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  date?: Date;
}

export interface UpdateAvailabilityData extends Partial<CreateAvailabilityData> {}

export interface AvailabilitySlot {
  date: string;
  time: string;
  available: boolean;
  duration: number;
}

// Search and filtering
export interface ServiceFilters extends PaginationParams {
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
}

export interface BookingFilters extends PaginationParams {
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  serviceId?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ClientFilters extends PaginationParams {
  search?: string;
  hasBookings?: boolean;
}

// Analytics types
export interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  revenue: number;
  averageBookingValue: number;
}

export interface ServiceStats {
  mostBooked: Array<{
    service: Service;
    bookingCount: number;
    revenue: number;
  }>;
  leastBooked: Array<{
    service: Service;
    bookingCount: number;
  }>;
}

export interface ClientStats {
  totalClients: number;
  newClientsThisMonth: number;
  topClients: Array<{
    client: Client;
    bookingCount: number;
    totalSpent: number;
  }>;
}

export interface DashboardStats {
  bookings: BookingStats;
  services: ServiceStats;
  clients: ClientStats;
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
}

// Notification types
export interface NotificationData {
  type: 'booking_created' | 'booking_updated' | 'booking_cancelled' | 'reminder';
  recipient: string;
  data: Record<string, any>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Integration types
export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
}

export interface SMSMessage {
  to: string;
  message: string;
  scheduledAt?: Date;
}