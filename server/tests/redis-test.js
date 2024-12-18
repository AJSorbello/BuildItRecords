const redisPool = require('../config/redisPool');

async function testRedisConnection() {
  try {
    console.log('Starting Redis connection test...');
    
    // Test pool initialization
    console.log('Pool stats:', redisPool.getPoolStats());
    
    // Test basic operations with circuit breaker
    console.log('\nTesting basic operations...');
    await redisPool.executeCommand('set', 'test:key', 'Hello Redis Cloud!');
    const value = await redisPool.executeCommand('get', 'test:key');
    console.log('Test value retrieved:', value);
    
    // Test multiple concurrent operations
    console.log('\nTesting concurrent operations...');
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        redisPool.executeCommand('set', `test:key:${i}`, `value:${i}`)
          .then(() => redisPool.executeCommand('get', `test:key:${i}`))
          .then(val => console.log(`Concurrent test ${i} value:`, val))
      );
    }
    await Promise.all(promises);
    
    // Test connection failure recovery
    console.log('\nTesting connection recovery...');
    try {
      // Force an error to test circuit breaker
      await redisPool.executeCommand('invalid_command');
    } catch (error) {
      console.log('Expected error caught:', error.message);
      console.log('Circuit breaker state:', redisPool.circuitBreaker.getState());
    }
    
    // Clean up test keys
    console.log('\nCleaning up test keys...');
    await redisPool.executeCommand('del', 'test:key');
    for (let i = 0; i < 5; i++) {
      await redisPool.executeCommand('del', `test:key:${i}`);
    }
    
    // Final pool stats
    console.log('\nFinal pool stats:', redisPool.getPoolStats());
    console.log('\nRedis test completed successfully!');
    
  } catch (error) {
    console.error('Redis test failed:', error);
  } finally {
    // Close all connections in the pool
    console.log('\nClosing Redis connections...');
    for (const connection of redisPool.pool) {
      await connection.quit();
    }
    process.exit(0);
  }
}

testRedisConnection();
