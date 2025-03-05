'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

// CRITICAL: Force Node.js to accept self-signed certificates in development
// This should never be used in production environments
if (env === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('⚠️ WARNING: SSL certificate validation disabled for development');
}

let sequelize;

// Use either the connection URL or individual parameters
if (process.env.POSTGRES_URL) {
  sequelize = new Sequelize(process.env.POSTGRES_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
  console.log('Database connection using POSTGRES_URL');
} else {
  // Use individual connection parameters
  const dbConfig = {
    host: process.env.DB_HOST || config.host || 'localhost',
    port: process.env.DB_PORT || config.port || 5432,
    database: process.env.DB_NAME || config.database || 'builditrecords',
    username: process.env.DB_USER || config.username || 'postgres',
    password: process.env.DB_PASSWORD || config.password || '',
    dialect: 'postgres',
    logging: false
  };
  
  // Only add SSL options if explicitly enabled
  if (process.env.DB_SSL === 'true' || config.dialectOptions?.ssl) {
    dbConfig.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    };
  }
  
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );
  
  console.log(`Database connection using parameters: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
}

// Automatically import all models in the current directory
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Set up model associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
