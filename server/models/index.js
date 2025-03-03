const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Log environment for debugging
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Database connection variables available:',
  'POSTGRES_URL:', process.env.POSTGRES_URL ? 'Yes (masked)' : 'No',
  'DATABASE_URL:', process.env.DATABASE_URL ? 'Yes (masked)' : 'No',
  'DB_HOST:', process.env.DB_HOST || 'Not set',
  'DB_PORT:', process.env.DB_PORT || 'Not set',
  'DB_NAME:', process.env.DB_NAME || 'Not set',
  'DB_USER:', process.env.DB_USER ? 'Yes (masked)' : 'No',
  'DB_SSL:', process.env.DB_SSL || 'Not set'
);

// Check for pg module
try {
  console.log('Checking for pg module...');
  const pg = require('pg');
  console.log('pg module available, version:', pg.version || 'unknown');
} catch (err) {
  console.error('ERROR: pg module not available:', err.message);
  console.error('This will cause Sequelize to fail when connecting to PostgreSQL');
  // Don't throw error here, let Sequelize handle it
}

// Create Sequelize instance
let sequelize;

// First try to use connection string if available (for Vercel deployment)
if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  console.log('Using connection string for database connection');
  
  try {
    sequelize = new Sequelize(connectionString, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        connectTimeout: 60000
      },
      define: {
        underscored: true,
        underscoredAll: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      retry: {
        max: 3,
        timeout: 30000
      }
    });
    console.log('Sequelize instance created successfully with connection string');
  } catch (err) {
    console.error('Failed to create Sequelize instance with connection string:', err);
    throw err; // Re-throw to fail the application startup
  }
} else {
  // Fall back to individual params
  console.log('Using individual connection parameters');
  try {
    sequelize = new Sequelize(
      process.env.DB_NAME || 'builditrecords',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        dialectOptions: {
          ssl: process.env.DB_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: false
          } : false,
          connectTimeout: 60000
        },
        define: {
          underscored: true,
          underscoredAll: true,
          createdAt: 'created_at',
          updatedAt: 'updated_at'
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        retry: {
          max: 3,
          timeout: 30000
        }
      }
    );
    console.log('Sequelize instance created successfully with individual parameters');
  } catch (err) {
    console.error('Failed to create Sequelize instance with individual parameters:', err);
    throw err; // Re-throw to fail the application startup
  }
}

// Initialize models
const Artist = require('./artist')(sequelize, DataTypes);
const Label = require('./label')(sequelize, DataTypes);
const Release = require('./release')(sequelize, DataTypes);
const Track = require('./track')(sequelize, DataTypes);
const ImportLog = require('./importLog')(sequelize, DataTypes);
const ReleaseArtist = require('./releaseArtist')(sequelize, DataTypes);
const TrackArtist = require('./trackArtist')(sequelize, DataTypes);
const DemoSubmission = require('./demo-submission')(sequelize, DataTypes);

// Set up associations
const models = {
  Artist,
  Label,
  Release,
  Track,
  ImportLog,
  ReleaseArtist,
  TrackArtist,
  DemoSubmission
};

Object.values(models)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(models));

// Test database connection
console.log('Testing database connection...');
sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('❌ Unable to connect to the database:', err);
    // In production, we might want to keep the server running even if DB connection fails initially
    if (process.env.NODE_ENV !== 'production') {
      console.error('Exiting process due to database connection failure');
      process.exit(1);
    }
  });

module.exports = {
  sequelize,
  ...models
};
