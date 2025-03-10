// Simple health check endpoint for API status verification
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // Set CORS headers to allow cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  console.log('Health check endpoint called');
  
  const startTime = new Date();
  
  try {
    // Get Supabase configuration
    const supabaseUrl = process.env.SUPABASE_URL || 
                        process.env.VITE_SUPABASE_URL || 
                        process.env.NEXT_PUBLIC_SUPABASE_URL;
                       
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                        process.env.VITE_SUPABASE_ANON_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Collect basic health data
    const healthData = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      supabase_connection: "unchecked",
      version: process.env.npm_package_version || '0.1.0'
    };
    
    // Check Supabase connection if credentials are available
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Basic connection test query
        const { data, error } = await supabase.from('artists').select('id').limit(1);
        
        if (error) {
          healthData.supabase_connection = "error";
          healthData.supabase_error = error.message;
        } else {
          healthData.supabase_connection = "ok";
          healthData.supabase_response_time = `${new Date() - startTime}ms`;
        }
      } catch (dbError) {
        healthData.supabase_connection = "error";
        healthData.supabase_error = dbError.message;
      }
    } else {
      healthData.supabase_connection = "unconfigured";
    }
    
    // Send health check response
    return res.status(200).json({
      success: true,
      message: "API is operational",
      data: healthData
    });
    
  } catch (error) {
    console.error(`Health check error: ${error.message}`);
    
    return res.status(200).json({
      success: false,
      message: `Health check failed: ${error.message}`,
      data: {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error.message
      }
    });
  }
};
