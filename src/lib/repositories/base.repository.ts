import { PrismaClient, Prisma } from '@prisma/client';

import { PaginationParams, PaginationResult } from '@/types/api';
import { DatabaseError, NotFoundError, TransactionError } from '@/lib/errors';

export abstract class BaseRepository<
  TModel,
  TCreateInput,
  TUpdateInput,
  TWhereInput = any,
  TOrderByInput = any
> {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly modelName: string
  ) {}

  // Abstract methods to be implemented by concrete repositories
  protected abstract getModel(): any;
  protected abstract createInclude(): any;
  protected abstract createSelect(): any;

  // Generic CRUD operations
  async create(data: TCreateInput): Promise<TModel> {
    try {
      const model = this.getModel();
      return await model.create({
        data,
        include: this.createInclude(),
      });
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  async findById(id: string): Promise<TModel | null> {
    try {
      const model = this.getModel();
      return await model.findUnique({
        where: { id },
        include: this.createInclude(),
      });
    } catch (error) {
      this.handleError(error, 'findById');
    }
  }

  async findByIdOrThrow(id: string): Promise<TModel> {
    const result = await this.findById(id);
    if (!result) {
      throw new NotFoundError(this.modelName, id);
    }
    return result;
  }

  async findMany(
    where?: TWhereInput,
    options?: {
      orderBy?: TOrderByInput;
      include?: any;
      select?: any;
      take?: number;
      skip?: number;
    }
  ): Promise<TModel[]> {
    try {
      const model = this.getModel();
      return await model.findMany({
        where,
        include: options?.include || this.createInclude(),
        select: options?.select,
        orderBy: options?.orderBy,
        take: options?.take,
        skip: options?.skip,
      });
    } catch (error) {
      this.handleError(error, 'findMany');
    }
  }

  async findWithPagination(
    where: TWhereInput,
    pagination: PaginationParams,
    orderBy?: TOrderByInput
  ): Promise<PaginationResult<TModel>> {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const model = this.getModel();
      const [items, total] = await Promise.all([
        model.findMany({
          where,
          include: this.createInclude(),
          orderBy: orderBy || { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        model.count({ where }),
      ]);

      const pages = Math.ceil(total / limit);

      return {
        items,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.handleError(error, 'findWithPagination');
    }
  }

  async update(id: string, data: TUpdateInput): Promise<TModel> {
    try {
      const model = this.getModel();
      return await model.update({
        where: { id },
        data,
        include: this.createInclude(),
      });
    } catch (error) {
      if (this.isPrismaNotFoundError(error)) {
        throw new NotFoundError(this.modelName, id);
      }
      this.handleError(error, 'update');
    }
  }

  async delete(id: string): Promise<TModel> {
    try {
      const model = this.getModel();
      return await model.delete({
        where: { id },
        include: this.createInclude(),
      });
    } catch (error) {
      if (this.isPrismaNotFoundError(error)) {
        throw new NotFoundError(this.modelName, id);
      }
      this.handleError(error, 'delete');
    }
  }

  async count(where?: TWhereInput): Promise<number> {
    try {
      const model = this.getModel();
      return await model.count({ where });
    } catch (error) {
      this.handleError(error, 'count');
    }
  }

  async exists(where: TWhereInput): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  // Transaction support
  async transaction<T>(
    operations: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(operations);
    } catch (error) {
      throw new TransactionError(
        error instanceof Error ? error.message : 'Transaction failed'
      );
    }
  }

  // Bulk operations
  async createMany(data: TCreateInput[]): Promise<{ count: number }> {
    try {
      const model = this.getModel();
      return await model.createMany({
        data,
        skipDuplicates: true,
      });
    } catch (error) {
      this.handleError(error, 'createMany');
    }
  }

  async updateMany(
    where: TWhereInput,
    data: Partial<TUpdateInput>
  ): Promise<{ count: number }> {
    try {
      const model = this.getModel();
      return await model.updateMany({
        where,
        data,
      });
    } catch (error) {
      this.handleError(error, 'updateMany');
    }
  }

  async deleteMany(where: TWhereInput): Promise<{ count: number }> {
    try {
      const model = this.getModel();
      return await model.deleteMany({
        where,
      });
    } catch (error) {
      this.handleError(error, 'deleteMany');
    }
  }

  // Aggregation support
  async aggregate(options: {
    where?: TWhereInput;
    _count?: any;
    _sum?: any;
    _avg?: any;
    _min?: any;
    _max?: any;
  }) {
    try {
      const model = this.getModel();
      return await model.aggregate(options);
    } catch (error) {
      this.handleError(error, 'aggregate');
    }
  }

  // Group by support
  async groupBy(options: {
    by: string[];
    where?: TWhereInput;
    _count?: any;
    _sum?: any;
    _avg?: any;
    _min?: any;
    _max?: any;
    orderBy?: any;
    having?: any;
  }) {
    try {
      const model = this.getModel();
      return await model.groupBy(options);
    } catch (error) {
      this.handleError(error, 'groupBy');
    }
  }

  // Error handling
  protected handleError(error: any, operation: string): never {
    if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      
      // Handle specific Prisma error codes
      switch (prismaError.code) {
        case 'P2002':
          throw new DatabaseError(
            `Unique constraint violation in ${operation}`,
            { code: prismaError.code, meta: prismaError.meta }
          );
        case 'P2025':
          throw new NotFoundError(this.modelName);
        case 'P2003':
          throw new DatabaseError(
            `Foreign key constraint violation in ${operation}`,
            { code: prismaError.code, meta: prismaError.meta }
          );
        default:
          throw new DatabaseError(
            `Database error in ${operation}: ${prismaError.message}`,
            { code: prismaError.code, meta: prismaError.meta }
          );
      }
    }

    // Generic database error
    throw new DatabaseError(
      `Database error in ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  protected isPrismaNotFoundError(error: any): boolean {
    return (
      error instanceof Error &&
      error.name === 'PrismaClientKnownRequestError' &&
      (error as Prisma.PrismaClientKnownRequestError).code === 'P2025'
    );
  }

  // Helper methods for common queries
  protected buildOrderBy(
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): TOrderByInput {
    if (!sortBy) {
      return { createdAt: sortOrder } as TOrderByInput;
    }

    return { [sortBy]: sortOrder } as TOrderByInput;
  }

  protected buildDateRangeFilter(
    dateFrom?: string,
    dateTo?: string,
    fieldName: string = 'createdAt'
  ): any {
    const filter: any = {};

    if (dateFrom || dateTo) {
      filter[fieldName] = {};
      
      if (dateFrom) {
        filter[fieldName].gte = new Date(dateFrom);
      }
      
      if (dateTo) {
        filter[fieldName].lte = new Date(dateTo);
      }
    }

    return filter;
  }

  protected buildSearchFilter(
    search?: string,
    fields: string[] = ['name']
  ): any {
    if (!search) {
      return {};
    }

    return {
      OR: fields.map(field => ({
        [field]: {
          contains: search,
          mode: 'insensitive' as const,
        },
      })),
    };
  }
}