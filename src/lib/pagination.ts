import { z } from 'zod';

import { PaginationParams, PaginationResult } from '@/types/api';
import { ValidationError } from '@/lib/errors';

// Pagination configuration
export const PAGINATION_CONFIG = {
  defaultLimit: 10,
  maxLimit: 100,
  defaultPage: 1,
} as const;

// Zod schema for pagination validation
export const paginationParamsSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .default(PAGINATION_CONFIG.defaultPage),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(PAGINATION_CONFIG.maxLimit, `Limit cannot exceed ${PAGINATION_CONFIG.maxLimit}`)
    .default(PAGINATION_CONFIG.defaultLimit),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Extended pagination schema with search
export const searchPaginationSchema = paginationParamsSchema.extend({
  search: z.string().min(1).optional(),
});

// Cursor-based pagination schema (for real-time data)
export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION_CONFIG.maxLimit)
    .default(PAGINATION_CONFIG.defaultLimit),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Types
export type SearchPaginationParams = z.infer<typeof searchPaginationSchema>;
export type CursorPaginationParams = z.infer<typeof cursorPaginationSchema>;

export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor?: string;
  prevCursor?: string;
  hasNext: boolean;
  hasPrev: boolean;
}

// Pagination utilities
export class PaginationUtils {
  // Validate and parse pagination parameters from URL search params
  static parseParams(searchParams: URLSearchParams): PaginationParams {
    const rawParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    };

    const result = paginationParamsSchema.safeParse(rawParams);
    
    if (!result.success) {
      throw new ValidationError('Invalid pagination parameters', {
        issues: result.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    return result.data;
  }

  // Parse search pagination parameters
  static parseSearchParams(searchParams: URLSearchParams): SearchPaginationParams {
    const rawParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
      search: searchParams.get('search'),
    };

    const result = searchPaginationSchema.safeParse(rawParams);
    
    if (!result.success) {
      throw new ValidationError('Invalid search pagination parameters', {
        issues: result.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    return result.data;
  }

  // Parse cursor pagination parameters
  static parseCursorParams(searchParams: URLSearchParams): CursorPaginationParams {
    const rawParams = {
      cursor: searchParams.get('cursor'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    };

    const result = cursorPaginationSchema.safeParse(rawParams);
    
    if (!result.success) {
      throw new ValidationError('Invalid cursor pagination parameters', {
        issues: result.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    return result.data;
  }

  // Calculate skip value for offset-based pagination
  static calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  // Create pagination result
  static createPaginationResult<T>(
    items: T[],
    total: number,
    params: PaginationParams
  ): PaginationResult<T> {
    const { page, limit } = params;
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
  }

  // Create cursor pagination result
  static createCursorPaginationResult<T>(
    items: T[],
    params: CursorPaginationParams,
    getCursor: (item: T) => string
  ): CursorPaginationResult<T> {
    const { limit } = params;
    const hasNext = items.length > limit;
    
    // Remove extra item used for hasNext detection
    if (hasNext) {
      items = items.slice(0, limit);
    }

    const nextCursor = hasNext && items.length > 0 
      ? getCursor(items[items.length - 1])
      : undefined;
      
    const prevCursor = items.length > 0 
      ? getCursor(items[0])
      : undefined;

    return {
      items,
      nextCursor,
      prevCursor,
      hasNext,
      hasPrev: !!params.cursor, // Has previous if we have a cursor
    };
  }

  // Generate pagination URLs for navigation
  static generatePaginationUrls(
    baseUrl: string,
    currentPage: number,
    totalPages: number,
    searchParams?: URLSearchParams
  ): {
    first?: string;
    prev?: string;
    next?: string;
    last?: string;
  } {
    const urls: any = {};
    const params = new URLSearchParams(searchParams);

    if (currentPage > 1) {
      // First page
      params.set('page', '1');
      urls.first = `${baseUrl}?${params.toString()}`;

      // Previous page
      params.set('page', (currentPage - 1).toString());
      urls.prev = `${baseUrl}?${params.toString()}`;
    }

    if (currentPage < totalPages) {
      // Next page
      params.set('page', (currentPage + 1).toString());
      urls.next = `${baseUrl}?${params.toString()}`;

      // Last page
      params.set('page', totalPages.toString());
      urls.last = `${baseUrl}?${params.toString()}`;
    }

    return urls;
  }

  // Generate cursor pagination URLs
  static generateCursorUrls(
    baseUrl: string,
    result: CursorPaginationResult<any>,
    searchParams?: URLSearchParams
  ): {
    next?: string;
    prev?: string;
  } {
    const urls: any = {};
    const params = new URLSearchParams(searchParams);

    if (result.hasNext && result.nextCursor) {
      params.set('cursor', result.nextCursor);
      urls.next = `${baseUrl}?${params.toString()}`;
    }

    if (result.hasPrev && result.prevCursor) {
      params.set('cursor', result.prevCursor);
      urls.prev = `${baseUrl}?${params.toString()}`;
    }

    return urls;
  }

  // Validate pagination bounds
  static validateBounds(page: number, limit: number, total: number): void {
    const maxPage = Math.ceil(total / limit) || 1;
    
    if (page > maxPage) {
      throw new ValidationError(
        `Page ${page} exceeds maximum page ${maxPage} for ${total} items`
      );
    }
  }

  // Get pagination metadata for headers
  static getPaginationHeaders(
    result: PaginationResult<any>,
    baseUrl: string,
    searchParams?: URLSearchParams
  ): Record<string, string> {
    const headers: Record<string, string> = {};
    const { pagination } = result;
    
    // Standard pagination headers
    headers['X-Total-Count'] = pagination.total.toString();
    headers['X-Page'] = pagination.page.toString();
    headers['X-Per-Page'] = pagination.limit.toString();
    headers['X-Total-Pages'] = pagination.pages.toString();

    // Link headers for navigation
    const urls = this.generatePaginationUrls(
      baseUrl,
      pagination.page,
      pagination.pages,
      searchParams
    );

    const linkParts = [];
    if (urls.first) linkParts.push(`<${urls.first}>; rel="first"`);
    if (urls.prev) linkParts.push(`<${urls.prev}>; rel="prev"`);
    if (urls.next) linkParts.push(`<${urls.next}>; rel="next"`);
    if (urls.last) linkParts.push(`<${urls.last}>; rel="last"`);

    if (linkParts.length > 0) {
      headers['Link'] = linkParts.join(', ');
    }

    return headers;
  }
}

// Pagination middleware for API routes
export function withPagination<T extends Record<string, any>>(
  handler: (
    request: Request,
    params: T,
    pagination: PaginationParams
  ) => Promise<Response>
) {
  return async (request: Request, context: { params: T }): Promise<Response> => {
    try {
      const url = new URL(request.url);
      const pagination = PaginationUtils.parseParams(url.searchParams);
      
      return await handler(request, context.params, pagination);
    } catch (error) {
      if (error instanceof ValidationError) {
        return Response.json(
          {
            success: false,
            error: error.message,
            code: error.code,
            details: error.details,
          },
          { status: 400 }
        );
      }
      throw error;
    }
  };
}

// Search pagination middleware
export function withSearchPagination<T extends Record<string, any>>(
  handler: (
    request: Request,
    params: T,
    pagination: SearchPaginationParams
  ) => Promise<Response>
) {
  return async (request: Request, context: { params: T }): Promise<Response> => {
    try {
      const url = new URL(request.url);
      const pagination = PaginationUtils.parseSearchParams(url.searchParams);
      
      return await handler(request, context.params, pagination);
    } catch (error) {
      if (error instanceof ValidationError) {
        return Response.json(
          {
            success: false,
            error: error.message,
            code: error.code,
            details: error.details,
          },
          { status: 400 }
        );
      }
      throw error;
    }
  };
}

// Cursor pagination middleware
export function withCursorPagination<T extends Record<string, any>>(
  handler: (
    request: Request,
    params: T,
    pagination: CursorPaginationParams
  ) => Promise<Response>
) {
  return async (request: Request, context: { params: T }): Promise<Response> => {
    try {
      const url = new URL(request.url);
      const pagination = PaginationUtils.parseCursorParams(url.searchParams);
      
      return await handler(request, context.params, pagination);
    } catch (error) {
      if (error instanceof ValidationError) {
        return Response.json(
          {
            success: false,
            error: error.message,
            code: error.code,
            details: error.details,
          },
          { status: 400 }
        );
      }
      throw error;
    }
  };
}

// React hooks for client-side pagination
export function usePagination(initialPage: number = 1, initialLimit: number = 10) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const nextPage = useCallback(() => setPage(p => p + 1), []);
  const prevPage = useCallback(() => setPage(p => Math.max(1, p - 1)), []);
  const goToPage = useCallback((newPage: number) => setPage(newPage), []);
  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setLimit(initialLimit);
  }, [initialPage, initialLimit]);

  return {
    page,
    limit,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    goToPage,
    changeLimit,
    reset,
  };
}

// Export for convenience
export { PAGINATION_CONFIG as config };