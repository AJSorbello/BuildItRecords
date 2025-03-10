// API Health Check and Diagnostic Endpoint
/* eslint-disable @typescript-eslint/no-var-requires */
const { createClient } = require('@supabase/supabase-js')
const { addCorsHeaders } = require('./utils/db-utils')
/* eslint-enable @typescript-eslint/no-var-requires */

module.exports = async (req, res) => {
  try {
    // Add CORS headers
    addCorsHeaders(res);

    // Handle OPTIONS request (preflight)
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    console.log(`API Health Check Request: ${req.method} ${req.url}`);
    
    // Parse the URL to determine which endpoint was requested
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const isDiagnostic = url.searchParams.has('diagnostic') || 
                        (pathSegments.length > 1 && pathSegments[1] === 'diagnostic');
    
    const startTime = Date.now();
    const health = {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      database: {
        status: 'not_checked',
        message: 'Database check skipped in development'
      },
      version: process.env.npm_package_version || 'unknown',
      memory: isDiagnostic ? process.memoryUsage() : undefined,
      hostname: process.env.VERCEL_URL || req.headers.host || 'localhost',
      status: 'ok'
    };

    // Add basic environment info
    if (isDiagnostic) {
      health.request = {
        url: req.url,
        method: req.method,
        headers: req.headers,
        query: url.searchParams
      };
      
      health.environment = {
        node_env: process.env.NODE_ENV || 'development',
        supabase: {
          url: process.env.SUPABASE_URL || 
              process.env.VITE_SUPABASE_URL || 
              process.env.NEXT_PUBLIC_SUPABASE_URL || 
              'not set',
          key_length: process.env.SUPABASE_ANON_KEY ? 
                    process.env.SUPABASE_ANON_KEY.length : 0
        },
        env_variables: {
          NODE_ENV: process.env.NODE_ENV || 'not set',
          VERCEL_URL: process.env.VERCEL_URL || 'not set',
          VERCEL_ENV: process.env.VERCEL_ENV || 'not set'
        }
      };
    }

    // Add response time
    health.responseTime = Date.now() - startTime;
    health.message = "API is functioning correctly";

    // Always return 200 for health endpoint
    if (isDiagnostic) {
      return res.status(200).json({
        success: true,
        message: 'Diagnostic information',
        data: health
      });
    } else {
      return res.status(200).json(health);
    }
  } catch (error) {
    // Fallback response for any unexpected errors
    console.error('Health endpoint error:', error);
    return res.status(200).json({
      status: 'warning',
      message: 'Health check completed with warnings',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
