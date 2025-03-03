// Health check API endpoint
module.exports = (req, res) => {
  // Log environment for debugging
  console.log('API Environment:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- POSTGRES_URL exists:', !!process.env.POSTGRES_URL);
  
  // Try to load pg module for diagnostic purposes
  try {
    const pg = require('pg');
    console.log('pg module loaded successfully, version:', pg.version || 'unknown');
  } catch (error) {
    console.error('Error loading pg module:', error.message);
  }
  
  // Return health status
  res.status(200).json({ 
    status: 'ok', 
    environment: process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString(),
    message: 'BuildItRecords API is running'
  });
};
