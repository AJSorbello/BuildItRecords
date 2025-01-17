/**
 * @fileoverview Security middleware
 * @module middleware/security
 */

const helmet = require('helmet');
const cors = require('cors');
const logger = require('../utils/logger');

// Configure security headers using helmet
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'http://localhost:3001'],
      fontSrc: ["'self'", 'https:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  dnsPrefetchControl: { allow: false },
  expectCt: {
    maxAge: 30,
    enforce: true,
  },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: false,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

// Configure CORS
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['Content-Range', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// SQL injection prevention
const preventSqlInjection = (req, res, next) => {
  const sqlInjectionPattern = /('|"|;|--|\/\*|\*\/|xp_|sp_|exec|execute|insert|select|delete|update|drop|union|into|load_file|outfile)/i;
  
  const checkValue = (value) => {
    if (typeof value === 'string' && sqlInjectionPattern.test(value)) {
      logger.warn('SQL injection attempt detected:', {
        ip: req.ip,
        path: req.path,
        value,
      });
      return true;
    }
    return false;
  };

  const checkObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        if (checkObject(obj[key])) return true;
      } else if (checkValue(obj[key])) {
        return true;
      }
    }
    return false;
  };

  if (
    checkObject(req.params) ||
    checkObject(req.query) ||
    checkObject(req.body)
  ) {
    return res.status(403).json({
      message: 'Invalid input detected',
    });
  }

  next();
};

// XSS prevention
const preventXss = (req, res, next) => {
  const xssPattern = /<[^>]*>|javascript:|data:|vbscript:|on\w+=/i;
  
  const checkValue = (value) => {
    if (typeof value === 'string' && xssPattern.test(value)) {
      logger.warn('XSS attempt detected:', {
        ip: req.ip,
        path: req.path,
        value,
      });
      return true;
    }
    return false;
  };

  const checkObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        if (checkObject(obj[key])) return true;
      } else if (checkValue(obj[key])) {
        return true;
      }
    }
    return false;
  };

  if (
    checkObject(req.params) ||
    checkObject(req.query) ||
    checkObject(req.body)
  ) {
    return res.status(403).json({
      message: 'Invalid input detected',
    });
  }

  next();
};

// Request size limiter
const requestSizeLimiter = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'], 10);
  const maxSize = process.env.MAX_REQUEST_SIZE || 10 * 1024 * 1024; // 10MB default

  if (contentLength > maxSize) {
    logger.warn('Request size exceeded limit:', {
      ip: req.ip,
      path: req.path,
      size: contentLength,
      limit: maxSize,
    });
    return res.status(413).json({
      message: 'Request entity too large',
      limit: `${maxSize / (1024 * 1024)}MB`,
    });
  }

  next();
};

module.exports = {
  securityHeaders,
  corsMiddleware: cors(corsOptions),
  preventSqlInjection,
  preventXss,
  requestSizeLimiter,
};
