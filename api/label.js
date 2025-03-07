/**
 * Consolidated label endpoint handler
 * Handles multiple label endpoints through path detection:
 * - /api/label - List all labels
 * - /api/label/[id] - Get label by ID
 */

const { createClient } = require('@supabase/supabase-js');
const { addCorsHeaders, getPool, formatResponse } = require('./utils/db-utils');

// Initialize database connection for PostgreSQL direct access
let pool;
try {
  pool = getPool();
} catch (error) {
  console.error('Database pool initialization error (non-fatal):', error.message);
}

module.exports = async (req, res) => {
  // Add CORS headers
  addCorsHeaders(res);

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`Label API Request: ${req.method} ${req.url}`);
  
  // Parse the URL to determine which endpoint was requested
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  
  try {
    // GET /api/label - List all labels
    if (pathSegments.length === 1) {
      return await getAllLabelsHandler(req, res);
    }
    // GET /api/label/[id] - Get label by ID
    else if (pathSegments.length === 2) {
      const labelId = pathSegments[1];
      return await getLabelByIdHandler(labelId, req, res);
    }
    else {
      return res.status(404).json({
        success: false,
        message: `Not found: ${req.url}`,
        data: null
      });
    }
  } catch (error) {
    console.error(`Label endpoint error: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: null
    });
  }
};

// Handler for GET /api/label - List all labels
async function getAllLabelsHandler(req, res) {
  console.log('Fetching all labels');
  
  const supabaseUrl = process.env.SUPABASE_URL || 
                      process.env.VITE_SUPABASE_URL || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL;
                     
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                      process.env.VITE_SUPABASE_ANON_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({
      success: false,
      message: 'Supabase configuration missing',
      data: null
    });
  }
  
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get all labels from Supabase
    const { data: labels, error } = await supabase
      .from('labels')
      .select('*');
    
    if (error) {
      console.error(`Error fetching labels with Supabase: ${error.message}`);
      
      // Try direct database query as fallback
      if (pool) {
        try {
          console.log('Falling back to direct database query for labels');
          const client = await pool.connect();
          
          const query = 'SELECT * FROM labels';
          
          console.log('Executing label query');
          const result = await client.query(query);
          client.release();
          
          console.log(`Found ${result.rows.length} labels via direct query`);
          
          return res.status(200).json({
            success: true,
            message: `Found ${result.rows.length} labels`,
            data: {
              labels: result.rows
            }
          });
        } catch (dbError) {
          console.error(`Direct database query error: ${dbError.message}`);
          return res.status(200).json({
            success: false,
            message: `Error fetching labels: ${dbError.message}`,
            data: {
              labels: []
            }
          });
        }
      }
      
      return res.status(200).json({
        success: false,
        message: `Error fetching labels: ${error.message}`,
        data: {
          labels: []
        }
      });
    }
    
    console.log(`Found ${labels.length} labels`);
    
    return res.status(200).json({
      success: true,
      message: `Found ${labels.length} labels`,
      data: {
        labels: labels
      }
    });
  } catch (error) {
    console.error(`Unexpected error in getAllLabelsHandler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: {
        labels: []
      }
    });
  }
}

// Handler for GET /api/label/[id] - Get label by ID
async function getLabelByIdHandler(labelId, req, res) {
  console.log(`Fetching label with ID: ${labelId}`);
  
  const supabaseUrl = process.env.SUPABASE_URL || 
                      process.env.VITE_SUPABASE_URL || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL;
                     
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                      process.env.VITE_SUPABASE_ANON_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({
      success: false,
      message: 'Supabase configuration missing',
      data: null
    });
  }
  
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get label by ID
    const { data: label, error } = await supabase
      .from('labels')
      .select('*')
      .eq('id', labelId)
      .single();
    
    if (error) {
      console.error(`Error fetching label ${labelId}: ${error.message}`);
      return res.status(200).json({
        success: false,
        message: `Error fetching label ${labelId}: ${error.message}`,
        data: null
      });
    }
    
    if (!label) {
      return res.status(200).json({
        success: false,
        message: `Label with ID ${labelId} not found`,
        data: null
      });
    }
    
    console.log(`Found label: ${label.name}`);
    
    return res.status(200).json({
      success: true,
      message: 'Label found',
      data: {
        label: label
      }
    });
  } catch (error) {
    console.error(`Unexpected error in getLabelByIdHandler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error: ${error.message}`,
      data: null
    });
  }
}
