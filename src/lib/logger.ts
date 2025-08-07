import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import { env, isProduction, isDevelopment } from './env';

// Log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
} as const;

// Colors for console output
const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
} as const;

winston.addColors(LOG_COLORS);

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta,
      environment: env.NODE_ENV,
    };
    
    // Add request context if available
    if (meta.requestId) {
      logEntry.requestId = meta.requestId;
    }
    
    if (meta.userId) {
      logEntry.userId = meta.userId;
    }
    
    if (meta.duration) {
      logEntry.duration = meta.duration;
    }
    
    return JSON.stringify(logEntry);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// File transport configuration
const fileTransport = new DailyRotateFile({
  filename: 'logs/booking-saas-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: isProduction ? 'info' : 'debug',
  format: structuredFormat,
});

// Error file transport
const errorFileTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: structuredFormat,
});

// Create logger instance
const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  levels: LOG_LEVELS,
  format: structuredFormat,
  defaultMeta: {
    service: 'booking-saas',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [
    fileTransport,
    errorFileTransport,
  ],
});

// Add console transport for development
if (isDevelopment) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug',
    })
  );
}

// Performance logging
export class PerformanceLogger {
  private static timers = new Map<string, number>();
  
  static start(operation: string): string {
    const timerId = `${operation}-${Date.now()}-${Math.random()}`;
    this.timers.set(timerId, Date.now());
    return timerId;
  }
  
  static end(timerId: string, operation: string, meta?: Record<string, any>): void {
    const startTime = this.timers.get(timerId);
    if (!startTime) return;
    
    const duration = Date.now() - startTime;
    this.timers.delete(timerId);
    
    logger.info(`Performance: ${operation}`, {
      operation,
      duration,
      ...meta,
    });
    
    // Warn for slow operations
    if (duration > 1000) {
      logger.warn(`Slow operation detected: ${operation}`, {
        operation,
        duration,
        threshold: 1000,
        ...meta,
      });
    }
  }
}

// Request logging middleware
export class RequestLogger {
  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  static logRequest(
    method: string,
    url: string,
    requestId: string,
    userId?: string,
    meta?: Record<string, any>
  ): void {
    logger.info('HTTP Request', {
      type: 'request',
      method,
      url,
      requestId,
      userId,
      userAgent: meta?.userAgent,
      ip: meta?.ip,
      timestamp: new Date().toISOString(),
    });
  }
  
  static logResponse(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    requestId: string,
    userId?: string,
    meta?: Record<string, any>
  ): void {
    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    
    logger[level]('HTTP Response', {
      type: 'response',
      method,
      url,
      statusCode,
      duration,
      requestId,
      userId,
      responseSize: meta?.responseSize,
    });
  }
  
  static logError(
    error: Error,
    method: string,
    url: string,
    requestId: string,
    userId?: string,
    meta?: Record<string, any>
  ): void {
    logger.error('HTTP Error', {
      type: 'error',
      method,
      url,
      requestId,
      userId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...meta,
    });
  }
}

// Business events logging
export class BusinessEventLogger {
  static logUserAction(
    action: string,
    userId: string,
    meta?: Record<string, any>
  ): void {
    logger.info('User Action', {
      type: 'user_action',
      action,
      userId,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }
  
  static logBookingEvent(
    event: 'created' | 'updated' | 'cancelled' | 'completed',
    bookingId: string,
    userId: string,
    meta?: Record<string, any>
  ): void {
    logger.info('Booking Event', {
      type: 'booking_event',
      event,
      bookingId,
      userId,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }
  
  static logPaymentEvent(
    event: 'initiated' | 'completed' | 'failed' | 'refunded',
    paymentId: string,
    userId: string,
    amount?: number,
    meta?: Record<string, any>
  ): void {
    logger.info('Payment Event', {
      type: 'payment_event',
      event,
      paymentId,
      userId,
      amount,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }
  
  static logIntegrationEvent(
    integration: 'stripe' | 'google' | 'twilio' | 'email',
    event: string,
    success: boolean,
    meta?: Record<string, any>
  ): void {
    const level = success ? 'info' : 'error';
    logger[level]('Integration Event', {
      type: 'integration_event',
      integration,
      event,
      success,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }
}

// Security events logging
export class SecurityLogger {
  static logAuthEvent(
    event: 'login' | 'logout' | 'register' | 'password_reset',
    userId?: string,
    success: boolean = true,
    meta?: Record<string, any>
  ): void {
    const level = success ? 'info' : 'warn';
    logger[level]('Auth Event', {
      type: 'auth_event',
      event,
      userId,
      success,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }
  
  static logSecurityEvent(
    event: 'rate_limit_exceeded' | 'suspicious_activity' | 'unauthorized_access',
    severity: 'low' | 'medium' | 'high' | 'critical',
    meta?: Record<string, any>
  ): void {
    logger.warn('Security Event', {
      type: 'security_event',
      event,
      severity,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }
  
  static logDataAccess(
    resource: string,
    action: 'read' | 'create' | 'update' | 'delete',
    userId: string,
    resourceId?: string,
    meta?: Record<string, any>
  ): void {
    logger.info('Data Access', {
      type: 'data_access',
      resource,
      action,
      userId,
      resourceId,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }
}

// Health and monitoring
export class HealthLogger {
  static logHealthCheck(
    service: string,
    status: 'healthy' | 'unhealthy' | 'degraded',
    responseTime?: number,
    meta?: Record<string, any>
  ): void {
    const level = status === 'healthy' ? 'info' : status === 'degraded' ? 'warn' : 'error';
    logger[level]('Health Check', {
      type: 'health_check',
      service,
      status,
      responseTime,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }
  
  static logMetric(
    metric: string,
    value: number,
    unit: string,
    tags?: Record<string, string>
  ): void {
    logger.info('Metric', {
      type: 'metric',
      metric,
      value,
      unit,
      tags,
      timestamp: new Date().toISOString(),
    });
  }
  
  static logAlert(
    alert: string,
    level: 'info' | 'warning' | 'critical',
    message: string,
    meta?: Record<string, any>
  ): void {
    const logLevel = level === 'critical' ? 'error' : level === 'warning' ? 'warn' : 'info';
    logger[logLevel]('Alert', {
      type: 'alert',
      alert,
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  }
}

// Utility functions
export function createChildLogger(meta: Record<string, any>) {
  return logger.child(meta);
}

export function setLogLevel(level: keyof typeof LOG_LEVELS) {
  logger.level = level;
}

// Export the main logger and specialized loggers
export {
  logger,
  PerformanceLogger,
  RequestLogger,
  BusinessEventLogger,
  SecurityLogger,
  HealthLogger,
};

// Export default logger
export default logger;