import { PrismaClient } from '@prisma/client';

import { ServiceRepository, createServiceRepository } from '@/lib/repositories/service.repository';
import {
  CreateServiceData,
  UpdateServiceData,
  ServiceWithStats,
  ServiceFilters,
  PaginationResult,
} from '@/types/api';
import { 
  ValidationError, 
  NotFoundError, 
  BusinessLogicError,
  AuthorizationError,
} from '@/lib/errors';
import { validateRequest } from '@/lib/validations';
import { createServiceSchema, updateServiceSchema } from '@/lib/validations';
import { sanitizeRequestBody } from '@/lib/sanitization';

export class ServiceService {
  private serviceRepository: ServiceRepository;

  constructor(private prisma: PrismaClient) {
    this.serviceRepository = createServiceRepository(prisma);
  }

  // Service CRUD operations
  async createService(
    userId: string,
    data: CreateServiceData
  ): Promise<ServiceWithStats> {
    // Validate input data
    const validation = validateRequest(createServiceSchema, data);
    if (!validation.success) {
      throw new ValidationError('Invalid service data', { issues: validation.issues });
    }

    // Sanitize input
    const sanitizedData = sanitizeRequestBody(validation.data, {
      name: 'text',
      description: 'html',
    });

    // Business logic validation
    await this.validateServiceCreation(userId, sanitizedData);

    // Create service
    return this.serviceRepository.create({
      ...sanitizedData,
      userId,
    });
  }

  async updateService(
    serviceId: string,
    userId: string,
    data: UpdateServiceData
  ): Promise<ServiceWithStats> {
    // Validate input data
    const validation = validateRequest(updateServiceSchema, data);
    if (!validation.success) {
      throw new ValidationError('Invalid service data', { issues: validation.issues });
    }

    // Sanitize input
    const sanitizedData = sanitizeRequestBody(validation.data, {
      name: 'text',
      description: 'html',
    });

    // Check if service exists and belongs to user
    const existingService = await this.serviceRepository.findByIdAndUserIdOrThrow(
      serviceId,
      userId
    );

    // Business logic validation
    await this.validateServiceUpdate(existingService, sanitizedData);

    // Update service
    return this.serviceRepository.update(serviceId, sanitizedData);
  }

  async deleteService(serviceId: string, userId: string): Promise<ServiceWithStats> {
    // Check if service exists and belongs to user
    const service = await this.serviceRepository.findByIdAndUserIdOrThrow(
      serviceId,
      userId
    );

    // Business logic validation
    await this.validateServiceDeletion(service);

    return this.serviceRepository.delete(serviceId);
  }

  async getService(serviceId: string, userId: string): Promise<ServiceWithStats> {
    return this.serviceRepository.findByIdAndUserIdOrThrow(serviceId, userId);
  }

  async getUserServices(
    userId: string,
    filters?: ServiceFilters
  ): Promise<PaginationResult<ServiceWithStats>> {
    return this.serviceRepository.findByUserId(userId, filters);
  }

  async getActiveServices(userId: string): Promise<ServiceWithStats[]> {
    return this.serviceRepository.findActiveByUserId(userId);
  }

  // Service management operations
  async toggleServiceActive(
    serviceId: string,
    userId: string
  ): Promise<ServiceWithStats> {
    const service = await this.serviceRepository.findByIdAndUserIdOrThrow(
      serviceId,
      userId
    );

    // Business logic for deactivating
    if (service.isActive) {
      await this.validateServiceDeactivation(service);
    }

    return this.serviceRepository.toggleActive(serviceId, userId);
  }

  async duplicateService(
    serviceId: string,
    userId: string,
    newName: string
  ): Promise<ServiceWithStats> {
    // Validate new name
    if (!newName || newName.trim().length < 2) {
      throw new ValidationError('Service name must be at least 2 characters');
    }

    // Check if service exists
    await this.serviceRepository.findByIdAndUserIdOrThrow(serviceId, userId);

    // Check if name is unique for this user
    const existingWithName = await this.serviceRepository.findMany(
      { userId, name: newName.trim() },
      { take: 1 }
    );

    if (existingWithName.length > 0) {
      throw new BusinessLogicError(
        `Service with name "${newName}" already exists`
      );
    }

    return this.serviceRepository.duplicate(serviceId, userId, newName.trim());
  }

  // Bulk operations
  async bulkUpdatePrices(
    userId: string,
    priceMultiplier: number,
    serviceIds?: string[]
  ): Promise<{ count: number; updatedServices: ServiceWithStats[] }> {
    // Validation
    if (priceMultiplier <= 0) {
      throw new ValidationError('Price multiplier must be positive');
    }

    if (priceMultiplier > 10) {
      throw new ValidationError('Price multiplier cannot exceed 10x');
    }

    // If specific services provided, validate they belong to user
    if (serviceIds && serviceIds.length > 0) {
      const services = await this.serviceRepository.findMany(
        { id: { in: serviceIds }, userId },
        { select: { id: true } }
      );

      if (services.length !== serviceIds.length) {
        throw new AuthorizationError('Some services do not belong to user');
      }
    }

    const result = await this.serviceRepository.bulkUpdatePrices(
      userId,
      priceMultiplier,
      serviceIds
    );

    // Get updated services
    const updatedServices = serviceIds 
      ? await this.serviceRepository.findMany({ id: { in: serviceIds } })
      : await this.serviceRepository.findMany({ userId });

    return {
      count: result.count,
      updatedServices,
    };
  }

  async bulkToggleActive(
    userId: string,
    isActive: boolean,
    serviceIds: string[]
  ): Promise<{ count: number }> {
    if (serviceIds.length === 0) {
      throw new ValidationError('No services provided');
    }

    // Validate services belong to user
    const services = await this.serviceRepository.findMany(
      { id: { in: serviceIds }, userId },
      { select: { id: true, isActive: true } }
    );

    if (services.length !== serviceIds.length) {
      throw new AuthorizationError('Some services do not belong to user');
    }

    // If deactivating, check for active bookings
    if (!isActive) {
      for (const service of services) {
        if (service.isActive) {
          await this.validateServiceDeactivation(service as ServiceWithStats);
        }
      }
    }

    return this.serviceRepository.bulkToggleActive(userId, isActive, serviceIds);
  }

  // Search and analytics
  async searchServices(
    userId: string,
    query: string,
    filters?: Omit<ServiceFilters, 'search'>
  ): Promise<PaginationResult<ServiceWithStats>> {
    if (!query || query.trim().length < 2) {
      throw new ValidationError('Search query must be at least 2 characters');
    }

    return this.serviceRepository.searchServices(userId, query.trim(), filters);
  }

  async getServiceStatistics(serviceId: string, userId: string) {
    // Verify service belongs to user
    await this.serviceRepository.findByIdAndUserIdOrThrow(serviceId, userId);

    return this.serviceRepository.getServiceStats(serviceId);
  }

  async getUserServiceStatistics(userId: string) {
    return this.serviceRepository.getUserServiceStats(userId);
  }

  // Business validation methods
  private async validateServiceCreation(
    userId: string,
    data: CreateServiceData
  ): Promise<void> {
    // Check for duplicate service name
    const existingService = await this.serviceRepository.findMany(
      { userId, name: data.name },
      { take: 1 }
    );

    if (existingService.length > 0) {
      throw new BusinessLogicError(
        `Service with name "${data.name}" already exists`
      );
    }

    // Business rules
    if (data.duration < 15) {
      throw new BusinessLogicError('Service duration must be at least 15 minutes');
    }

    if (data.duration > 480) {
      throw new BusinessLogicError('Service duration cannot exceed 8 hours');
    }

    if (data.price < 0) {
      throw new BusinessLogicError('Service price cannot be negative');
    }

    if (data.price > 10000) {
      throw new BusinessLogicError('Service price cannot exceed €10,000');
    }
  }

  private async validateServiceUpdate(
    existingService: ServiceWithStats,
    data: UpdateServiceData
  ): Promise<void> {
    // Check for duplicate name if name is being updated
    if (data.name && data.name !== existingService.name) {
      const duplicateService = await this.serviceRepository.findMany(
        { 
          userId: existingService.userId, 
          name: data.name,
          id: { not: existingService.id }
        },
        { take: 1 }
      );

      if (duplicateService.length > 0) {
        throw new BusinessLogicError(
          `Service with name "${data.name}" already exists`
        );
      }
    }

    // Business rules validation
    if (data.duration !== undefined) {
      if (data.duration < 15) {
        throw new BusinessLogicError('Service duration must be at least 15 minutes');
      }
      if (data.duration > 480) {
        throw new BusinessLogicError('Service duration cannot exceed 8 hours');
      }
    }

    if (data.price !== undefined) {
      if (data.price < 0) {
        throw new BusinessLogicError('Service price cannot be negative');
      }
      if (data.price > 10000) {
        throw new BusinessLogicError('Service price cannot exceed €10,000');
      }
    }
  }

  private async validateServiceDeletion(
    service: ServiceWithStats
  ): Promise<void> {
    // Check for active bookings
    const activeBookings = await this.prisma.booking.count({
      where: {
        serviceId: service.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startTime: { gte: new Date() },
      },
    });

    if (activeBookings > 0) {
      throw new BusinessLogicError(
        `Cannot delete service with ${activeBookings} active future bookings`
      );
    }
  }

  private async validateServiceDeactivation(
    service: ServiceWithStats
  ): Promise<void> {
    // Check for confirmed future bookings
    const confirmedBookings = await this.prisma.booking.count({
      where: {
        serviceId: service.id,
        status: 'CONFIRMED',
        startTime: { gte: new Date() },
      },
    });

    if (confirmedBookings > 0) {
      throw new BusinessLogicError(
        `Cannot deactivate service with ${confirmedBookings} confirmed future bookings`
      );
    }
  }
}

// Factory function
export function createServiceService(prisma: PrismaClient): ServiceService {
  return new ServiceService(prisma);
}