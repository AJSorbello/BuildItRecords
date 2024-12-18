const Redis = require('ioredis');
require('dotenv').config();

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_TLS === 'true' ? {
    rejectUnauthorized: false,
    servername: process.env.REDIS_HOST
  } : undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true; // Only reconnect on specific errors
    }
    return false;
  },
  maxRetriesPerRequest: 3,
  autoResendUnfulfilledCommands: true,
  autoResubscribe: true
};

console.log('Connecting to Redis...');

const redis = new Redis(redisConfig);

redis.on('connect', () => {
  console.log('Connected to Redis successfully!');
});

redis.on('error', (err) => {
  if (err.code === 'ECONNRESET') {
    console.log('Redis connection reset, attempting to reconnect...');
  } else {
    console.error('Redis connection error:', err);
  }
});

redis.on('ready', () => {
  console.log('Redis client is ready to accept commands');
});

redis.on('reconnecting', () => {
  console.log('Redis client is reconnecting...');
});

module.exports = redis;
