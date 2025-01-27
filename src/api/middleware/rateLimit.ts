/**
 * @module RateLimit
 * @description Memory-based rate limiting middleware for API protection
 */

import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../../utils/errors';

/**
 * Creates a rate limiter with specified configuration
 * @param windowMs - Time window in milliseconds
 * @param max - Maximum number of requests per window
 * @param keyPrefix - Prefix for rate limiter instance
 * @returns Configured rate limiter middleware
 */
const createRateLimiter = (
  windowMs: number,
  max: number,
  keyPrefix: string
) => rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, _res, next) => {
    next(new RateLimitError('Too many requests', windowMs));
  },
  keyGenerator: (req) => {
    // Can be customized based on requirements (e.g., API key, user ID)
    return `${keyPrefix}:${req.ip}`;
  },
  skip: (req) => {
    // Skip rate limiting for development environment
    return process.env.NODE_ENV === 'development';
  }
});

/**
 * General API rate limiter
 * Limits: 100 requests per 15 minutes
 */
export const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100,
  'api'
);

/**
 * Search endpoint rate limiter
 * Limits: 10 searches per minute
 * More restrictive due to resource intensity
 */
export const searchLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10,
  'search'
);

/**
 * Import operation rate limiter
 * Limits: 5 imports per hour
 * Highly restricted due to heavy processing
 */
export const importLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  5,
  'import'
);

/**
 * Authentication attempt rate limiter
 * Limits: 5 attempts per 15 minutes
 * Prevents brute force attacks
 */
export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5,
  'auth'
);
