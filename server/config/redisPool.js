const Redis = require('ioredis');
const CircuitBreaker = require('../utils/circuitBreaker');

class RedisPool {
  constructor(options = {}) {
    this.minConnections = options.minConnections || 3;
    this.maxConnections = options.maxConnections || 10;
    this.connectionTimeout = options.connectionTimeout || 5000;
    this.pool = [];
    this.isInitialized = false;
    this.circuitBreaker = new CircuitBreaker();
  }

  createConnection() {
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      tls: process.env.REDIS_TLS === 'true' ? {
        rejectUnauthorized: false,
        requestCert: true,
        ca: null
      } : undefined,
      retryStrategy: (times) => {
        if (times > 10) {
          console.error('Max Redis retry attempts reached');
          return null; // stop retrying
        }
        const delay = Math.min(times * 1000, 5000);
        console.log(`Retrying Redis connection in ${delay}ms (attempt ${times})`);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        if (err.message.includes('ECONNRESET')) {
          console.log('Connection reset by peer, reconnecting...');
          return true;
        }
        return false;
      },
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      enableOfflineQueue: true,
      enableReadyCheck: true,
      autoResubscribe: true,
      autoResendUnfulfilledCommands: true,
      keepAlive: 30000,
      noDelay: true,
      commandTimeout: 5000,
      lazyConnect: true,
      retryBackoff: 200
    });

    redis.on('error', (err) => {
      if (err.message.includes('ECONNRESET')) {
        console.log('Connection reset by peer, will auto-reconnect');
        return;
      }
      console.error('Redis connection error:', err);
      this.circuitBreaker.recordFailure();
    });

    redis.on('connect', () => {
      console.log('Redis connection established');
      this.circuitBreaker.recordSuccess();
    });

    redis.on('ready', () => {
      console.log('Redis connection is ready');
    });

    redis.on('reconnecting', (delay) => {
      console.log(`Redis reconnecting in ${delay}ms...`);
    });

    redis.on('end', () => {
      console.log('Redis connection ended, will try to reconnect');
    });

    return redis;
  }

  async initializePool() {
    if (this.isInitialized) {
      console.log('Redis pool already initialized');
      return;
    }

    console.log('Initializing Redis pool...');
    
    try {
      for (let i = 0; i < this.minConnections; i++) {
        const connection = this.createConnection();
        await connection.connect();
        
        // Test the connection
        try {
          await connection.ping();
          this.pool.push(connection);
          console.log(`Redis pool initialized with ${i + 1} connections`);
        } catch (err) {
          console.error('Connection test failed:', err);
          throw err;
        }
      }
      
      this.isInitialized = true;
      console.log('Redis pool initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Redis pool:', error);
      throw error;
    }
  }

  async getConnection() {
    if (!this.isInitialized) {
      throw new Error('Redis pool not initialized');
    }

    if (this.circuitBreaker.isOpen()) {
      throw new Error('Circuit breaker is open');
    }

    // Simple round-robin for now
    const connection = this.pool.shift();
    this.pool.push(connection);
    return connection;
  }

  async executeCommand(command, ...args) {
    const connection = await this.getConnection();
    try {
      const result = await connection[command](...args);
      this.circuitBreaker.recordSuccess();
      return result;
    } catch (error) {
      this.circuitBreaker.recordFailure();
      throw error;
    }
  }

  pipeline() {
    if (!this.isInitialized) {
      throw new Error('Redis pool not initialized');
    }
    return this.pool[0].pipeline();
  }

  getPoolStats() {
    return {
      poolSize: this.pool.length,
      isInitialized: this.isInitialized,
      circuitBreakerState: this.circuitBreaker.getState()
    };
  }
}

// Create a singleton instance
const redisPool = new RedisPool();

module.exports = redisPool;
