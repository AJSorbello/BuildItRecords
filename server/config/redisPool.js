const Redis = require('redis');
const config = require('./environment');

class RedisPool {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  async connect() {
    if (this.isConnected) return;

    try {
      this.client = Redis.createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
          tls: config.redis.tls,
        },
        username: config.redis.username || undefined,
        password: config.redis.password || undefined,
        retry_strategy: (options) => {
          if (options.attempt > this.retryAttempts) {
            return new Error('Redis connection retry limit exceeded');
          }
          return this.retryDelay * Math.pow(2, options.attempt - 1);
        }
      });

      // Handle connection events
      this.client.on('error', (err) => {
        console.error('Redis connection error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async executeCommand(command, ...args) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      switch (command) {
        case 'setex':
          return await this.client.setEx(args[0], args[1], args[2]);
        case 'get':
          return await this.client.get(args[0]);
        case 'set':
          return await this.client.set(args[0], args[1]);
        case 'del':
          return await this.client.del(args[0]);
        case 'keys':
          return await this.client.keys(args[0]);
        case 'flushdb':
          return await this.client.flushDb();
        case 'ping':
          return await this.client.ping();
        case 'zadd':
          return await this.client.zAdd(args[0], { score: args[1], value: args[2] });
        case 'zrange':
          return await this.client.zRange(args[0], args[1], args[2]);
        case 'zremrangebyscore':
          return await this.client.zRemRangeByScore(args[0], args[1], args[2]);
        case 'zrangebyscore':
          return await this.client.zRangeByScore(args[0], args[1], args[2], args[3]);
        case 'sadd':
          return await this.client.sAdd(args[0], args[1]);
        case 'smembers':
          return await this.client.sMembers(args[0]);
        case 'type':
          return await this.client.type(args[0]);
        default:
          throw new Error(`Unsupported Redis command: ${command}`);
      }
    } catch (error) {
      console.error(`Redis command error (${command}):`, error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

module.exports = new RedisPool();
