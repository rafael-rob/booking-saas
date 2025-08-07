// Custom error classes for better error handling

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication and Authorization errors
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', details?: Record<string, any>) {
    super(message, 401, 'AUTHENTICATION_ERROR', true, details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: Record<string, any>) {
    super(message, 403, 'AUTHORIZATION_ERROR', true, details);
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = 'Invalid or expired token', details?: Record<string, any>) {
    super(message, 401, 'INVALID_TOKEN', true, details);
  }
}

// Validation errors
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class SchemaValidationError extends ValidationError {
  constructor(issues: Array<{ path: string; message: string }>) {
    const message = `Validation failed: ${issues.map(i => i.message).join(', ')}`;
    super(message, { issues });
    this.code = 'SCHEMA_VALIDATION_ERROR';
  }
}

// Resource errors
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', true, { resource, id });
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: Record<string, any>) {
    super(message, 409, 'CONFLICT', true, details);
  }
}

export class DuplicateError extends ConflictError {
  constructor(resource: string, field: string, value: string) {
    super(`${resource} with ${field} '${value}' already exists`, {
      resource,
      field,
      value,
    });
    this.code = 'DUPLICATE_ERROR';
  }
}

// Business logic errors
export class BusinessLogicError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 422, 'BUSINESS_LOGIC_ERROR', true, details);
  }
}

export class BookingConflictError extends BusinessLogicError {
  constructor(startTime: Date, endTime: Date, conflictingBookingId?: string) {
    super('Booking time slot conflicts with existing booking', {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      conflictingBookingId,
    });
    this.code = 'BOOKING_CONFLICT';
  }
}

export class ServiceUnavailableError extends BusinessLogicError {
  constructor(serviceId: string, date: Date) {
    super('Service is not available at the requested time', {
      serviceId,
      date: date.toISOString(),
    });
    this.code = 'SERVICE_UNAVAILABLE';
  }
}

export class InvalidTimeSlotError extends BusinessLogicError {
  constructor(startTime: Date, endTime: Date, reason: string) {
    super(`Invalid time slot: ${reason}`, {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      reason,
    });
    this.code = 'INVALID_TIME_SLOT';
  }
}

// External service errors
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string = 'External service error', details?: Record<string, any>) {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', true, { service, ...details });
  }
}

export class PaymentError extends ExternalServiceError {
  constructor(message: string = 'Payment processing failed', details?: Record<string, any>) {
    super('Payment', message, details);
    this.code = 'PAYMENT_ERROR';
  }
}

export class EmailError extends ExternalServiceError {
  constructor(message: string = 'Email sending failed', details?: Record<string, any>) {
    super('Email', message, details);
    this.code = 'EMAIL_ERROR';
  }
}

export class SMSError extends ExternalServiceError {
  constructor(message: string = 'SMS sending failed', details?: Record<string, any>) {
    super('SMS', message, details);
    this.code = 'SMS_ERROR';
  }
}

// Rate limiting errors
export class RateLimitError extends AppError {
  constructor(retryAfter: number, details?: Record<string, any>) {
    super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED', true, {
      retryAfter,
      ...details,
    });
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', details?: Record<string, any>) {
    super(message, 500, 'DATABASE_ERROR', false, details);
  }
}

export class TransactionError extends DatabaseError {
  constructor(message: string = 'Transaction failed', details?: Record<string, any>) {
    super(message, details);
    this.code = 'TRANSACTION_ERROR';
  }
}

// File and upload errors
export class FileError extends AppError {
  constructor(message: string = 'File operation failed', details?: Record<string, any>) {
    super(message, 400, 'FILE_ERROR', true, details);
  }
}

export class FileSizeError extends FileError {
  constructor(maxSize: number, actualSize: number) {
    super(`File size ${actualSize} bytes exceeds limit of ${maxSize} bytes`, {
      maxSize,
      actualSize,
    });
    this.code = 'FILE_SIZE_ERROR';
  }
}

export class FileTypeError extends FileError {
  constructor(allowedTypes: string[], actualType: string) {
    super(`File type ${actualType} not allowed. Allowed types: ${allowedTypes.join(', ')}`, {
      allowedTypes,
      actualType,
    });
    this.code = 'FILE_TYPE_ERROR';
  }
}

// Error handling utilities
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: any): boolean {
  return isAppError(error) && error.isOperational;
}

// Error response creator
export function createErrorResponse(error: AppError | Error) {
  if (isAppError(error)) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      ...(error.details && { details: error.details }),
    };
  }
  
  // For unknown errors, don't expose details
  return {
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  };
}

// Error logger
export function logError(error: AppError | Error, context?: Record<string, any>) {
  const logData = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (isAppError(error)) {
    logData.statusCode = error.statusCode;
    logData.code = error.code;
    logData.isOperational = error.isOperational;
    logData.details = error.details;
  }

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', logData);
  } else {
    // In production, you might want to send to monitoring service
    // e.g., Sentry, LogRocket, etc.
    console.error(JSON.stringify(logData));
  }
}

// Async error wrapper for route handlers
export function asyncErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return (...args: T): Promise<R> => {
    return fn(...args).catch((error) => {
      logError(error, { handler: fn.name });
      throw error;
    });
  };
}

// Error boundary for React components (if needed)
export class ErrorBoundary {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  static componentDidCatch(error: Error, errorInfo: any) {
    logError(error, { errorInfo });
  }
}