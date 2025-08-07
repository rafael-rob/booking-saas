import { Booking, BookingStatus, Prisma, PrismaClient } from '@prisma/client';

import { BaseRepository } from './base.repository';
import {
  CreateBookingData,
  UpdateBookingData,
  BookingWithRelations,
  BookingFilters,
  PaginationResult,
  BookingStats,
} from '@/types/api';
import { BookingConflictError, InvalidTimeSlotError } from '@/lib/errors';

export class BookingRepository extends BaseRepository<
  BookingWithRelations,
  CreateBookingData & { userId: string },
  UpdateBookingData,
  Prisma.BookingWhereInput,
  Prisma.BookingOrderByWithRelationInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'Booking');
  }

  protected getModel() {
    return this.prisma.booking;
  }

  protected createInclude() {
    return {
      service: {
        select: {
          id: true,
          name: true,
          description: true,
          duration: true,
          price: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
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
      serviceId: true,
      clientId: true,
      clientName: true,
      clientEmail: true,
      clientPhone: true,
      startTime: true,
      endTime: true,
      status: true,
      paymentStatus: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
    };
  }

  // Booking-specific methods
  async findByUserId(
    userId: string,
    filters?: BookingFilters
  ): Promise<PaginationResult<BookingWithRelations>> {
    const where: Prisma.BookingWhereInput = {
      userId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.serviceId && { serviceId: filters.serviceId }),
      ...(filters?.clientId && { clientId: filters.clientId }),
      ...this.buildDateRangeFilter(filters?.dateFrom, filters?.dateTo, 'startTime'),
    };

    const orderBy = this.buildOrderBy(filters?.sortBy, filters?.sortOrder);

    return this.findWithPagination(where, filters || { page: 1, limit: 10 }, orderBy);
  }

  async findByIdAndUserId(id: string, userId: string): Promise<BookingWithRelations | null> {
    return this.findMany({ id, userId }, { take: 1 }).then(results => results[0] || null);
  }

  async findByIdAndUserIdOrThrow(id: string, userId: string): Promise<BookingWithRelations> {
    const booking = await this.findByIdAndUserId(id, userId);
    if (!booking) {
      throw new NotFoundError('Booking', id);
    }
    return booking;
  }

  async findUpcoming(userId: string, limit: number = 10): Promise<BookingWithRelations[]> {
    const now = new Date();
    return this.findMany(
      {
        userId,
        startTime: { gte: now },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      {
        orderBy: { startTime: 'asc' },
        take: limit,
      }
    );
  }

  async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BookingWithRelations[]> {
    return this.findMany(
      {
        userId,
        startTime: { gte: startDate },
        endTime: { lte: endDate },
      },
      { orderBy: { startTime: 'asc' } }
    );
  }

  async findByServiceAndDateRange(
    serviceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BookingWithRelations[]> {
    return this.findMany(
      {
        serviceId,
        startTime: { gte: startDate },
        endTime: { lte: endDate },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      { orderBy: { startTime: 'asc' } }
    );
  }

  // Conflict checking
  async checkTimeSlotConflict(
    userId: string,
    serviceId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<BookingWithRelations | null> {
    const where: Prisma.BookingWhereInput = {
      userId,
      serviceId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      ...(excludeBookingId && { id: { not: excludeBookingId } }),
      OR: [
        // New booking starts before existing ends and ends after existing starts
        {
          AND: [
            { startTime: { lte: endTime } },
            { endTime: { gte: startTime } },
          ],
        },
      ],
    };

    const conflicts = await this.findMany(where, { take: 1 });
    return conflicts[0] || null;
  }

  async validateTimeSlot(
    userId: string,
    serviceId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<void> {
    // Check if start time is before end time
    if (startTime >= endTime) {
      throw new InvalidTimeSlotError(
        startTime,
        endTime,
        'Start time must be before end time'
      );
    }

    // Check if booking is in the past
    const now = new Date();
    if (startTime < now) {
      throw new InvalidTimeSlotError(
        startTime,
        endTime,
        'Cannot create booking in the past'
      );
    }

    // Check for conflicts
    const conflict = await this.checkTimeSlotConflict(
      userId,
      serviceId,
      startTime,
      endTime,
      excludeBookingId
    );

    if (conflict) {
      throw new BookingConflictError(startTime, endTime, conflict.id);
    }
  }

  // Business operations
  async createWithValidation(
    data: CreateBookingData & { userId: string }
  ): Promise<BookingWithRelations> {
    await this.validateTimeSlot(
      data.userId,
      data.serviceId,
      data.startTime,
      data.endTime
    );

    return this.create(data);
  }

  async updateWithValidation(
    id: string,
    userId: string,
    data: UpdateBookingData
  ): Promise<BookingWithRelations> {
    const existingBooking = await this.findByIdAndUserIdOrThrow(id, userId);

    // If updating time, validate the new slot
    if (data.startTime || data.endTime) {
      const newStartTime = data.startTime || existingBooking.startTime;
      const newEndTime = data.endTime || existingBooking.endTime;

      await this.validateTimeSlot(
        userId,
        existingBooking.serviceId,
        newStartTime,
        newEndTime,
        id // Exclude current booking from conflict check
      );
    }

    return this.update(id, data);
  }

  async updateStatus(
    id: string,
    userId: string,
    status: BookingStatus,
    notes?: string
  ): Promise<BookingWithRelations> {
    return this.updateWithValidation(id, userId, { status, notes });
  }

  async cancel(
    id: string,
    userId: string,
    reason?: string
  ): Promise<BookingWithRelations> {
    return this.updateStatus(id, userId, 'CANCELLED', reason);
  }

  async confirm(
    id: string,
    userId: string,
    notes?: string
  ): Promise<BookingWithRelations> {
    return this.updateStatus(id, userId, 'CONFIRMED', notes);
  }

  async complete(
    id: string,
    userId: string,
    notes?: string
  ): Promise<BookingWithRelations> {
    return this.updateStatus(id, userId, 'COMPLETED', notes);
  }

  // Statistics and analytics
  async getBookingStats(userId: string, dateFrom?: Date, dateTo?: Date): Promise<BookingStats> {
    const where: Prisma.BookingWhereInput = {
      userId,
      ...this.buildDateRangeFilter(
        dateFrom?.toISOString(),
        dateTo?.toISOString(),
        'startTime'
      ),
    };

    const [statusCounts, revenueData] = await Promise.all([
      this.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.booking.aggregate({
        where: {
          ...where,
          status: 'COMPLETED',
        },
        _sum: { service: { price: true } },
        _count: { _all: true },
      }),
    ]);

    const statusMap = statusCounts.reduce((acc: any, item: any) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {});

    const total = Object.values(statusMap).reduce((sum: number, count: number) => sum + count, 0);
    const completedCount = statusMap.COMPLETED || 0;
    const revenue = revenueData._sum?.service?.price || 0;

    return {
      total,
      pending: statusMap.PENDING || 0,
      confirmed: statusMap.CONFIRMED || 0,
      cancelled: statusMap.CANCELLED || 0,
      completed: completedCount,
      revenue,
      averageBookingValue: completedCount > 0 ? revenue / completedCount : 0,
    };
  }

  async getDailyBookings(
    userId: string,
    date: Date
  ): Promise<BookingWithRelations[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.findByDateRange(userId, startOfDay, endOfDay);
  }

  async getWeeklyBookings(
    userId: string,
    weekStart: Date
  ): Promise<BookingWithRelations[]> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return this.findByDateRange(userId, weekStart, weekEnd);
  }

  async getMonthlyBookings(
    userId: string,
    year: number,
    month: number
  ): Promise<BookingWithRelations[]> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    return this.findByDateRange(userId, startOfMonth, endOfMonth);
  }

  // Bulk operations
  async bulkUpdateStatus(
    userId: string,
    bookingIds: string[],
    status: BookingStatus,
    notes?: string
  ): Promise<{ count: number }> {
    const where: Prisma.BookingWhereInput = {
      userId,
      id: { in: bookingIds },
    };

    return this.updateMany(where, { status, notes });
  }

  async bulkCancel(
    userId: string,
    bookingIds: string[],
    reason?: string
  ): Promise<{ count: number }> {
    return this.bulkUpdateStatus(userId, bookingIds, 'CANCELLED', reason);
  }

  // Calendar integration helpers
  async findForCalendarSync(
    userId: string,
    lastSyncDate?: Date
  ): Promise<BookingWithRelations[]> {
    const where: Prisma.BookingWhereInput = {
      userId,
      status: { in: ['CONFIRMED', 'COMPLETED'] },
      ...(lastSyncDate && { updatedAt: { gte: lastSyncDate } }),
    };

    return this.findMany(where, {
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Client history
  async findByClientEmail(
    userId: string,
    clientEmail: string
  ): Promise<BookingWithRelations[]> {
    return this.findMany(
      { userId, clientEmail },
      { orderBy: { createdAt: 'desc' } }
    );
  }
}

// Export factory function
export function createBookingRepository(prisma: PrismaClient): BookingRepository {
  return new BookingRepository(prisma);
}