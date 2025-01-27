/**
 * @module Logging
 * @description Comprehensive logging system for API requests and errors
 */

import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extended Request interface to include request ID
 */
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

/**
 * Winston logger configuration
 * Includes file and console transports based on environment
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'build-it-records-api' },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

/**
 * Request logging middleware
 * Logs incoming requests and their completion
 * Adds unique request ID for tracing
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * 
 * @example
 * ```typescript
 * app.use(requestLogger);
 * ```
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Generate unique request ID
  const requestId = uuidv4();
  req.id = requestId;

  // Start time for duration calculation
  const startTime = Date.now();
  
  // Create base log entry
  const logEntry = {
    requestId,
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    referer: req.get('referer'),
    correlationId: req.get('x-correlation-id'),
  };

  // Log request start
  logger.info('Request started', {
    ...logEntry,
    type: 'request_start',
    timestamp: new Date().toISOString(),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      ...logEntry,
      type: 'request_end',
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length'),
      timestamp: new Date().toISOString(),
    });

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        ...logEntry,
        duration,
        threshold: 1000,
      });
    }
  });

  next();
}

/**
 * Error logging middleware
 * Logs detailed error information including stack traces
 * 
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function errorLogger(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('Error occurred', {
    requestId: req.id,
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    },
    request: {
      method: req.method,
      url: req.url,
      query: req.query,
      body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
      headers: req.headers,
    },
    timestamp: new Date().toISOString(),
  });
  
  next(err);
}

/**
 * Performance monitoring middleware
 * Tracks request duration and logs slow requests
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function performanceLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds

    // Log detailed performance metrics
    const metrics = {
      requestId: req.id,
      method: req.method,
      url: req.url,
      duration,
      statusCode: res.statusCode,
      contentLength: res.get('content-length'),
      timestamp: new Date().toISOString(),
    };

    if (duration > 1000) {
      logger.warn('Slow request detected', {
        ...metrics,
        type: 'performance_warning',
      });
    }

    // Log performance metrics for all requests
    logger.info('Request performance', {
      ...metrics,
      type: 'performance_metric',
    });
  });

  next();
}

/**
 * Utility function to sanitize sensitive data from logs
 * @param data - Data to sanitize
 * @returns Sanitized data
 */
function sanitizeSensitiveData(data: any): any {
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data };
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

// Export logger for use in other parts of the application
export { logger };
