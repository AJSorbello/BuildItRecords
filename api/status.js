// Simple status endpoint to test API routing
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  console.log('Status endpoint called');
  
  return res.status(200).json({
    success: true,
    message: "API is operational",
    data: {
      status: "ok",
      timestamp: new Date().toISOString()
    }
  });
};
