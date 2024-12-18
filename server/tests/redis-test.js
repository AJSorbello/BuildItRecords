const redis = require('../config/redis');

async function testRedisConnection() {
  try {
    // Wait for connection
    await new Promise((resolve, reject) => {
      redis.once('connect', resolve);
      redis.once('error', reject);
    });

    // Test basic set/get operations
    await redis.set('test:key', 'Hello Redis Cloud!');
    const value = await redis.get('test:key');
    console.log('Test value retrieved:', value);
    
    // Clean up test key
    await redis.del('test:key');
    
    console.log('Redis test completed successfully!');
  } catch (error) {
    console.error('Redis test failed:', error);
  } finally {
    // Close the Redis connection
    await redis.quit();
    process.exit(0);
  }
}

testRedisConnection();
