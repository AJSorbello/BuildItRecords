const Redis = require('ioredis');
require('dotenv').config();

const redis = new Redis(
  `rediss://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  {
    tls: process.env.REDIS_TLS === 'true' ? {
      rejectUnauthorized: false
    } : undefined,
    retryStrategy: (times) => {
      const maxRetryTime = 3000;
      const delay = Math.min(times * 50, maxRetryTime);
      console.log(`Retrying Redis connection... Attempt ${times}`);
      return delay;
    },
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    enableOfflineQueue: false,
    reconnectOnError: (err) => {
      console.log('Redis reconnect on error:', err);
      return true;
    }
  }
);

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('connect', () => {
  console.log('Successfully connected to Redis Cloud');
});

redis.on('ready', () => {
  console.log('Redis client is ready to accept commands');
});

module.exports = redis;
