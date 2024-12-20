const path = require('path');
const dotenv = require('dotenv');

// Determine which environment to use
const NODE_ENV = process.env.NODE_ENV || 'development';

// Load environment variables
const envPath = path.resolve(process.cwd(), `.env.${NODE_ENV}`);
dotenv.config({ path: envPath });

// Fallback to .env if environment-specific file doesn't exist
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const config = {
  env: NODE_ENV,
  port: process.env.PORT || 3001,
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true',
  },
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
  },
  admin: {
    username: process.env.ADMIN_USERNAME,
    passwordHash: process.env.ADMIN_PASSWORD_HASH,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
};

// Validate required configuration
const validateConfig = (config) => {
  const requiredFields = {
    'redis.host': config.redis.host,
    'redis.port': config.redis.port,
    'redis.password': config.redis.password,
    'spotify.clientId': config.spotify.clientId,
    'spotify.clientSecret': config.spotify.clientSecret,
    'spotify.redirectUri': config.spotify.redirectUri,
    'jwt.secret': config.jwt.secret,
  };

  const missing = Object.entries(requiredFields)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
};

// Validate configuration before exporting
validateConfig(config);

module.exports = config;
