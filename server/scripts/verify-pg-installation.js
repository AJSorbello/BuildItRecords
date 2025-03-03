/**
 * This script verifies if the pg module is properly installed and functional
 * It will attempt to:
 * 1. Verify pg is installed
 * 2. Verify pg-hstore is installed  
 * 3. Create a test connection to your database
 */

console.log('Starting Postgres installation verification script');

// Try to load pg
try {
  const pgModule = require('pg');
  console.log('✅ pg module is installed and loadable');
  console.log('pg module version:', require('pg/package.json').version);
} catch (err) {
  console.error('❌ Error loading pg module:', err.message);
  console.error('This suggests pg is not properly installed.');
  console.error('Please run: npm install pg');
}

// Try to load pg-hstore
try {
  const pgHstore = require('pg-hstore');
  console.log('✅ pg-hstore module is installed and loadable');
} catch (err) {
  console.error('❌ Error loading pg-hstore module:', err.message);
  console.error('This suggests pg-hstore is not properly installed.');
  console.error('Please run: npm install pg-hstore');
}

// Try to use Sequelize
try {
  const { Sequelize } = require('sequelize');
  console.log('✅ sequelize module is installed and loadable');
  
  // Try connection with connection string
  if (process.env.POSTGRES_URL) {
    console.log('Testing database connection using POSTGRES_URL');
    const sequelize = new Sequelize(process.env.POSTGRES_URL, {
      dialect: 'postgres',
      logging: console.log,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });
    
    sequelize.authenticate()
      .then(() => {
        console.log('✅ Database connection using POSTGRES_URL successful');
      })
      .catch(err => {
        console.error('❌ Database connection using POSTGRES_URL failed:', err.message);
      });
  }
  
  // Try connection with individual parameters
  if (process.env.DB_NAME && process.env.DB_HOST) {
    console.log('Testing database connection using individual parameters');
    const sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: console.log,
        dialectOptions: {
          ssl: process.env.DB_SSL === 'true' ? {
            require: true, 
            rejectUnauthorized: false
          } : false
        }
      }
    );
    
    sequelize.authenticate()
      .then(() => {
        console.log('✅ Database connection using individual parameters successful');
      })
      .catch(err => {
        console.error('❌ Database connection using individual parameters failed:', err.message);
      });
  }
} catch (err) {
  console.error('❌ Error using sequelize module:', err.message);
}

// Print all environment variables related to the database connection
console.log('\nEnvironment variables:');
console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? 'Set (value hidden)' : 'Not set');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER ? 'Set (value hidden)' : 'Not set');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'Set (value hidden)' : 'Not set');
console.log('DB_SSL:', process.env.DB_SSL);
console.log('NODE_ENV:', process.env.NODE_ENV);
