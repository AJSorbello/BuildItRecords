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
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'buildit_records',
    dialect: 'postgres'
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
    secret: process.env.JWT_SECRET || 'development-secret',
  },
};

// Validate required configuration
const validateConfig = (config) => {
  const requiredFields = {
    'database.host': config.database.host,
    'database.port': config.database.port,
    'database.name': config.database.name,
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
