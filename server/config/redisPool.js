const Redis = require('ioredis');
const CircuitBreaker = require('../utils/circuitBreaker');
require('dotenv').config();

class RedisPool {
  constructor() {
    this.pool = [];
    this.maxConnections = 3;
    this.minConnections = 1; // Reduced to minimize connection overhead
    this.connectionTimeout = 3000; // 3 seconds
    this.retryInterval = 2000;
    this.keepAliveInterval = 10000; // 10 seconds
    this.lastUsedIndex = 0;
    this.isInitialized = false;
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 10000,
      monitorInterval: 2000
    });
    this.initializePool().catch(err => {
      console.error('Failed to initialize Redis pool:', err);
    });
  }

  createConnection() {
    const redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      tls: process.env.REDIS_TLS === 'true' ? {
        rejectUnauthorized: false
      } : undefined,
      retryStrategy: (times) => {
        if (times > 3) return false; // Stop retrying after 3 attempts
        return Math.min(times * 200, 1000); // Exponential backoff
      },
      maxRetriesPerRequest: 2,
      connectTimeout: this.connectionTimeout,
      enableOfflineQueue: false, // Disable offline queue to fail fast
      enableReadyCheck: true,
      autoResubscribe: false,
      autoResendUnfulfilledCommands: false,
      keepAlive: 5000,
      noDelay: true,
      commandTimeout: 3000, // Timeout for individual commands
      lazyConnect: true // Don't connect immediately
    });

    redis.on('error', (error) => {
      console.error('Redis connection error:', error);
      this.handleConnectionError(redis);
    });

    redis.on('connect', () => {
      console.log('Redis connection established');
    });

    redis.on('ready', () => {
      console.log('Redis connection ready');
    });

    redis.on('end', () => {
      console.log('Redis connection ended');
      this.handleConnectionEnd(redis);
    });

    redis.on('reconnecting', (delay) => {
      console.log(`Redis reconnecting in ${delay}ms`);
    });

    return redis;
  }

  async initializePool() {
    console.log('Initializing Redis connection pool...');
    try {
      for (let i = 0; i < this.minConnections; i++) {
        const connection = this.createConnection();
        await connection.connect();
        this.pool.push(connection);
      }
      this.isInitialized = true;
      this.startKeepAlive();
      this.startHealthCheck();
    } catch (error) {
      console.error('Failed to initialize Redis pool:', error);
      throw error;
    }
  }

  async executeCommand(command, ...args) {
    if (!this.isInitialized) {
      throw new Error('Redis pool not initialized');
    }

    return this.circuitBreaker.execute(async () => {
      const connection = await this.getConnection();
      if (!connection) {
        throw new Error('No Redis connections available');
      }

      try {
        return await connection[command](...args);
      } catch (error) {
        if (error.message.includes('ECONNRESET')) {
          // Remove and replace the problematic connection
          await this.handleConnectionError(connection);
          throw error; // Let the circuit breaker handle retry
        }
        throw error;
      }
    });
  }

  startKeepAlive() {
    setInterval(async () => {
      console.log('Running keep-alive check on Redis pool...');
      for (let i = 0; i < this.pool.length; i++) {
        try {
          await this.circuitBreaker.execute(async () => {
            const start = Date.now();
            await this.pool[i].ping();
            const latency = Date.now() - start;
            console.log(`Connection ${i} latency: ${latency}ms`);
            
            // Replace connection if latency is too high
            if (latency > 1000) {
              console.log(`High latency detected (${latency}ms). Replacing connection ${i}`);
              await this.pool[i].quit();
              this.pool[i] = this.createConnection();
            }
          });
        } catch (error) {
          console.error(`Keep-alive failed for connection ${i}:`, error);
          // Replace failed connection
          this.pool[i] = this.createConnection();
        }
      }
    }, this.keepAliveInterval);
  }

  startHealthCheck() {
    setInterval(async () => {
      console.log('Running health check on Redis pool...');
      const stats = this.getPoolStats();
      
      // Ensure minimum connections
      if (this.pool.length < this.minConnections) {
        console.log('Pool size below minimum. Adding new connections...');
        while (this.pool.length < this.minConnections) {
          this.pool.push(this.createConnection());
        }
      }
      
      // Test each connection
      for (let i = 0; i < this.pool.length; i++) {
        try {
          await this.pool[i].ping();
        } catch (error) {
          console.error(`Connection ${i} failed health check:`, error);
          this.pool[i] = this.createConnection();
        }
      }
      
      console.log('Health check completed:', stats);
    }, this.keepAliveInterval * 2);  // Run health check less frequently than keep-alive
  }

  handleConnectionError(connection) {
    const index = this.pool.indexOf(connection);
    if (index !== -1) {
      this.pool.splice(index, 1);
      if (this.pool.length < this.minConnections) {
        setTimeout(() => {
          if (this.pool.length < this.minConnections) {
            this.pool.push(this.createConnection());
          }
        }, this.retryInterval);
      }
    }
  }

  handleConnectionEnd(connection) {
    const index = this.pool.indexOf(connection);
    if (index !== -1) {
      this.pool.splice(index, 1);
      if (this.pool.length < this.minConnections) {
        this.pool.push(this.createConnection());
      }
    }
  }

  async getConnection() {
    if (this.pool.length === 0) {
      console.log('No connections available, creating new connection');
      const newConnection = this.createConnection();
      this.pool.push(newConnection);
      return newConnection;
    }

    // Round-robin selection with health check
    let attempts = 0;
    const maxAttempts = this.pool.length;

    while (attempts < maxAttempts) {
      this.lastUsedIndex = (this.lastUsedIndex + 1) % this.pool.length;
      const connection = this.pool[this.lastUsedIndex];

      try {
        // Quick health check
        await this.circuitBreaker.execute(async () => {
          await connection.ping();
        });
        return connection;
      } catch (error) {
        console.error('Connection health check failed:', error);
        attempts++;
      }
    }

    // If all existing connections fail, create a new one
    console.log('All connections failed health check, creating new connection');
    const newConnection = this.createConnection();
    this.pool.push(newConnection);
    return newConnection;
  }

  getPoolStats() {
    return {
      poolSize: this.pool.length,
      circuitBreakerState: this.circuitBreaker.getState(),
      lastUsedIndex: this.lastUsedIndex
    };
  }
}

// Create a singleton instance
const redisPool = new RedisPool();

module.exports = redisPool;
