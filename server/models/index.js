const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Create Sequelize instance
let sequelize;

// First try to use connection string if available (for Vercel deployment)
if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  console.log('Using connection string for database connection');
  
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
    }
  });
} else {
  // Fall back to individual params
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
      }
    }
  );
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
sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = {
  sequelize,
  ...models
};
