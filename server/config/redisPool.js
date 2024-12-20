const { createClient } = require('redis');

class RedisPool {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.connectionAttempts = 0;
    this.maxAttempts = 5;
    this.initializeConnection();
  }

  async initializeConnection() {
    if (this.connectionAttempts >= this.maxAttempts) {
      console.error('Max connection attempts reached');
      return;
    }

    this.connectionAttempts++;

    try {
      this.client = createClient({
        socket: {
          host: 'localhost',
          port: 6379,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('connect', () => {
        console.log('Redis connected');
        this.connectionAttempts = 0;
      });

      this.client.on('ready', () => {
        console.log('Redis ready');
        this.isInitialized = true;
      });

      this.client.on('error', (err) => {
        console.error('Redis error:', err.message);
        if (err.message.includes('ECONNRESET') || err.message.includes('Connection is closed')) {
          this.handleConnectionError();
        }
      });

      this.client.on('end', () => {
        console.log('Redis connection ended');
        this.isInitialized = false;
        this.handleConnectionError();
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis:', error.message);
      throw error;
    }
  }

  async handleConnectionError() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (error) {
        console.error('Error disconnecting Redis:', error.message);
      }
    }

    setTimeout(() => {
      this.initializeConnection();
    }, 1000);
  }

  async initializePool() {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.client.ping();
      console.log('Redis connection established');
    } catch (error) {
      console.error('Failed to initialize Redis:', error.message);
      throw error;
    }
  }

  async executeCommand(command, ...args) {
    if (!this.client || !this.isInitialized) {
      throw new Error('Redis client not initialized');
    }

    try {
      const result = await this.client[command](...args);
      return result;
    } catch (error) {
      if (error.message.includes('ECONNRESET') || error.message.includes('Connection is closed')) {
        await this.handleConnectionError();
        throw new Error('Redis connection error, please retry');
      }
      console.error(`Error executing Redis command ${command}:`, error.message);
      throw error;
    }
  }
}

const redisPool = new RedisPool();
module.exports = redisPool;
