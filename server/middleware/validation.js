/**
 * @fileoverview Validation middleware for API requests
 * @module middleware/validation
 */

const { validationResult, body, param, query } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Validate track request body
 */
const validateTrack = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Track name is required')
    .isLength({ max: 255 })
    .withMessage('Track name must be less than 255 characters'),
  
  body('artists')
    .isArray()
    .withMessage('Artists must be an array')
    .notEmpty()
    .withMessage('At least one artist is required'),
  
  body('artists.*.id')
    .optional()
    .isString()
    .withMessage('Artist ID must be a string'),
  
  body('artists.*.name')
    .trim()
    .notEmpty()
    .withMessage('Artist name is required')
    .isLength({ max: 255 })
    .withMessage('Artist name must be less than 255 characters'),
  
  body('album')
    .optional()
    .isObject()
    .withMessage('Album must be an object'),
  
  body('album.id')
    .optional()
    .isString()
    .withMessage('Album ID must be a string'),
  
  body('album.name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Album name is required if album is provided')
    .isLength({ max: 255 })
    .withMessage('Album name must be less than 255 characters'),
  
  body('duration_ms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive integer'),
  
  body('isrc')
    .optional()
    .isString()
    .matches(/^[A-Z]{2}-?[A-Z0-9]{3}-?[0-9]{2}-?[0-9]{5}$/)
    .withMessage('Invalid ISRC format'),
  
  handleValidationErrors
];

/**
 * Validate pagination parameters
 */
const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  
  handleValidationErrors
];

/**
 * Validate ID parameter
 */
const validateId = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('ID is required')
    .isString()
    .withMessage('ID must be a string'),
  
  handleValidationErrors
];

/**
 * Handle validation errors
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation error:', errors.array());
    return res.status(400).json({
      message: 'Validation error',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
}

/**
 * Validate API key if present
 */
function validateApiKey(req, res, next) {
  const apiKey = req.header('X-API-Key');
  if (apiKey) {
    // Add your API key validation logic here
    // For example, check against a database of valid API keys
    if (!isValidApiKey(apiKey)) {
      logger.warn('Invalid API key:', apiKey);
      return res.status(401).json({
        message: 'Invalid API key'
      });
    }
    
    // Add rate limiting based on API key tier
    const tier = getApiKeyTier(apiKey);
    applyRateLimiting(req, res, tier);
  }
  next();
}

/**
 * Check if API key is valid
 * @param {string} apiKey - API key to validate
 * @returns {boolean} - Whether the API key is valid
 */
function isValidApiKey(apiKey) {
  // Implement your API key validation logic
  // For example, check against a database of valid API keys
  return true; // Placeholder implementation
}

/**
 * Get API key tier
 * @param {string} apiKey - API key
 * @returns {string} - API key tier
 */
function getApiKeyTier(apiKey) {
  // Implement your API key tier logic
  // For example, check against a database of API key tiers
  return 'basic'; // Placeholder implementation
}

/**
 * Apply rate limiting based on API key tier
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} tier - API key tier
 */
function applyRateLimiting(req, res, tier) {
  // Implement your rate limiting logic based on tier
  // For example, use different rate limits for different tiers
  switch (tier) {
    case 'basic':
      // Basic tier: 100 requests per minute
      req.rateLimit = { limit: 100, window: 60 };
      break;
    case 'premium':
      // Premium tier: 1000 requests per minute
      req.rateLimit = { limit: 1000, window: 60 };
      break;
    case 'enterprise':
      // Enterprise tier: 10000 requests per minute
      req.rateLimit = { limit: 10000, window: 60 };
      break;
    default:
      // Default tier: 50 requests per minute
      req.rateLimit = { limit: 50, window: 60 };
  }
}

module.exports = {
  validateTrack,
  validatePagination,
  validateId,
  validateApiKey
};
