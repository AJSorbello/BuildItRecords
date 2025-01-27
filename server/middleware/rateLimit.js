/**
 * @fileoverview Rate limiting middleware
 * @module middleware/rateLimit
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Configure rate limiter with memory store
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable legacy headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded:', {
      ip: req.ip,
      path: req.path,
      headers: req.headers,
    });
    res.status(429).json({
      message: 'Too many requests, please try again later',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
  // Skip rate limiting for whitelisted IPs
  skip: (req) => {
    const whitelistedIps = process.env.RATE_LIMIT_WHITELIST
      ? process.env.RATE_LIMIT_WHITELIST.split(',')
      : [];
    return whitelistedIps.includes(req.ip);
  },
  // Key generator function
  keyGenerator: (req) => {
    // Use API key if present, otherwise use IP
    return req.header('X-API-Key') || req.ip;
  },
});

// Create tiered rate limiters
const createTieredLimiter = (windowMs, max) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Tiered rate limit exceeded:', {
        ip: req.ip,
        path: req.path,
        tier: req.tier,
        headers: req.headers,
      });
      res.status(429).json({
        message: 'Rate limit exceeded for your tier',
        retryAfter: res.getHeader('Retry-After'),
        tier: req.tier,
      });
    },
    skip: (req) => {
      const whitelistedIps = process.env.RATE_LIMIT_WHITELIST
        ? process.env.RATE_LIMIT_WHITELIST.split(',')
        : [];
      return whitelistedIps.includes(req.ip);
    },
    keyGenerator: (req) => {
      return req.header('X-API-Key') || req.ip;
    },
  });
};

// Define tier limits
const tierLimits = {
  basic: createTieredLimiter(15 * 60 * 1000, 100), // 100 requests per 15 minutes
  premium: createTieredLimiter(15 * 60 * 1000, 1000), // 1000 requests per 15 minutes
  enterprise: createTieredLimiter(15 * 60 * 1000, 10000), // 10000 requests per 15 minutes
};

/**
 * Apply rate limiting based on tier
 * @param {string} tier - API key tier
 * @returns {Function} Express middleware
 */
const getTierLimiter = (tier) => {
  return tierLimits[tier] || limiter;
};

module.exports = {
  limiter,
  getTierLimiter,
};
