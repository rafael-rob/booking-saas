import { Service, Prisma, PrismaClient } from '@prisma/client';

import { BaseRepository } from './base.repository';
import {
  CreateServiceData,
  UpdateServiceData,
  ServiceWithStats,
  ServiceFilters,
  PaginationResult,
} from '@/types/api';

export interface ServiceStats {
  totalBookings: number;
  totalRevenue: number;
  averageRating?: number;
  lastBookingAt?: Date;
}

export class ServiceRepository extends BaseRepository<
  ServiceWithStats,
  CreateServiceData & { userId: string },
  UpdateServiceData,
  Prisma.ServiceWhereInput,
  Prisma.ServiceOrderByWithRelationInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'Service');
  }

  protected getModel() {
    return this.prisma.service;
  }

  protected createInclude() {
    return {
      _count: {
        select: {
          bookings: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          businessName: true,
        },
      },
    };
  }

  protected createSelect() {
    return {
      id: true,
      name: true,
      description: true,
      duration: true,
      price: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
    };
  }

  // Service-specific methods
  async findByUserId(
    userId: string,
    filters?: ServiceFilters
  ): Promise<PaginationResult<ServiceWithStats>> {
    const where: Prisma.ServiceWhereInput = {
      userId,
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters?.minPrice !== undefined && { price: { gte: filters.minPrice } }),
      ...(filters?.maxPrice !== undefined && { 
        price: { ...{ gte: filters.minPrice }, lte: filters.maxPrice } 
      }),
      ...(filters?.minDuration !== undefined && { duration: { gte: filters.minDuration } }),
      ...(filters?.maxDuration !== undefined && { 
        duration: { ...{ gte: filters.minDuration }, lte: filters.maxDuration } 
      }),
    };

    const orderBy = this.buildOrderBy(filters?.sortBy, filters?.sortOrder);

    return this.findWithPagination(where, filters || { page: 1, limit: 10 }, orderBy);
  }

  async findActiveByUserId(userId: string): Promise<ServiceWithStats[]> {
    return this.findMany(
      { userId, isActive: true },
      { orderBy: { name: 'asc' } }
    );
  }

  async findByIdAndUserId(id: string, userId: string): Promise<ServiceWithStats | null> {
    return this.findMany({ id, userId }, { take: 1 }).then(results => results[0] || null);
  }

  async findByIdAndUserIdOrThrow(id: string, userId: string): Promise<ServiceWithStats> {
    const service = await this.findByIdAndUserId(id, userId);
    if (!service) {
      throw new NotFoundError('Service', id);
    }
    return service;
  }

  // Statistics and analytics
  async getServiceStats(serviceId: string): Promise<ServiceStats> {
    const stats = await this.aggregate({
      where: { id: serviceId },
      _count: { bookings: true },
    });

    const revenueStats = await this.prisma.booking.aggregate({
      where: { serviceId, status: 'COMPLETED' },
      _sum: { service: { price: true } },
    });

    const lastBooking = await this.prisma.booking.findFirst({
      where: { serviceId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return {
      totalBookings: stats._count?.bookings || 0,
      totalRevenue: revenueStats._sum?.service?.price || 0,
      lastBookingAt: lastBooking?.createdAt,
    };
  }

  async getUserServiceStats(userId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    mostBooked: Array<ServiceWithStats & { bookingCount: number }>;
    revenue: {
      total: number;
      thisMonth: number;
    };
  }> {
    const [totalCount, activeCount, inactiveCount] = await Promise.all([
      this.count({ userId }),
      this.count({ userId, isActive: true }),
      this.count({ userId, isActive: false }),
    ]);

    // Get most booked services
    const mostBooked = await this.prisma.service.findMany({
      where: { userId },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: {
        bookings: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    // Calculate revenue
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const [totalRevenue, monthRevenue] = await Promise.all([
      this.prisma.booking.aggregate({
        where: {
          service: { userId },
          status: 'COMPLETED',
        },
        _sum: {
          service: { price: true },
        },
      }),
      this.prisma.booking.aggregate({
        where: {
          service: { userId },
          status: 'COMPLETED',
          createdAt: { gte: thisMonth },
        },
        _sum: {
          service: { price: true },
        },
      }),
    ]);

    return {
      total: totalCount,
      active: activeCount,
      inactive: inactiveCount,
      mostBooked: mostBooked.map(service => ({
        ...service,
        bookingCount: service._count.bookings,
      })) as any,
      revenue: {
        total: totalRevenue._sum?.service?.price || 0,
        thisMonth: monthRevenue._sum?.service?.price || 0,
      },
    };
  }

  // Business operations
  async toggleActive(id: string, userId: string): Promise<ServiceWithStats> {
    const service = await this.findByIdAndUserIdOrThrow(id, userId);
    return this.update(id, { isActive: !service.isActive });
  }

  async duplicate(id: string, userId: string, newName: string): Promise<ServiceWithStats> {
    const originalService = await this.findByIdAndUserIdOrThrow(id, userId);
    
    const duplicateData: CreateServiceData & { userId: string } = {
      name: newName,
      description: originalService.description,
      duration: originalService.duration,
      price: originalService.price,
      isActive: false, // Start as inactive by default
      userId,
    };

    return this.create(duplicateData);
  }

  // Bulk operations
  async bulkUpdatePrices(
    userId: string,
    priceMultiplier: number,
    serviceIds?: string[]
  ): Promise<{ count: number }> {
    const where: Prisma.ServiceWhereInput = {
      userId,
      ...(serviceIds && { id: { in: serviceIds } }),
    };

    // Note: Prisma doesn't support direct multiplication in updateMany
    // So we need to fetch services first, then update individually
    const services = await this.findMany(where, { select: { id: true, price: true } });
    
    const updatePromises = services.map(service =>
      this.update(service.id, {
        price: Math.round(service.price * priceMultiplier * 100) / 100, // Round to 2 decimals
      })
    );

    await Promise.all(updatePromises);
    
    return { count: services.length };
  }

  async bulkToggleActive(
    userId: string,
    isActive: boolean,
    serviceIds?: string[]
  ): Promise<{ count: number }> {
    const where: Prisma.ServiceWhereInput = {
      userId,
      ...(serviceIds && { id: { in: serviceIds } }),
    };

    return this.updateMany(where, { isActive });
  }

  // Search and filtering
  async searchServices(
    userId: string,
    query: string,
    filters?: Omit<ServiceFilters, 'search'>
  ): Promise<PaginationResult<ServiceWithStats>> {
    const searchFilter = this.buildSearchFilter(query, ['name', 'description']);
    
    const where: Prisma.ServiceWhereInput = {
      userId,
      ...searchFilter,
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters?.minPrice !== undefined && { price: { gte: filters.minPrice } }),
      ...(filters?.maxPrice !== undefined && { 
        price: { ...{ gte: filters.minPrice }, lte: filters.maxPrice } 
      }),
    };

    const orderBy = this.buildOrderBy(filters?.sortBy, filters?.sortOrder);

    return this.findWithPagination(where, filters || { page: 1, limit: 10 }, orderBy);
  }
}

// Export a factory function to create repository instance
export function createServiceRepository(prisma: PrismaClient): ServiceRepository {
  return new ServiceRepository(prisma);
}