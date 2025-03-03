require('dotenv').config();
const { Sequelize } = require('sequelize');

// Function to test connection with individual parameters
async function testIndividualConnection() {
  try {
    console.log('Testing connection with individual parameters:');
    console.log({
      DB_HOST: process.env.DB_HOST || '(not set)',
      DB_PORT: process.env.DB_PORT || '(not set)',
      DB_NAME: process.env.DB_NAME || '(not set)',
      DB_USER: process.env.DB_USER || '(not set)',
      DB_PASSWORD: process.env.DB_PASSWORD ? '(set)' : '(not set)',
      DB_SSL: process.env.DB_SSL || '(not set)'
    });
    
    const sequelize = new Sequelize(
      process.env.DB_NAME || 'builditrecords',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        dialectOptions: {
          ssl: process.env.DB_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: false
          } : false
        }
      }
    );
    
    await sequelize.authenticate();
    console.log('Individual connection successful!');
    
    // Test a simple query
    const result = await sequelize.query('SELECT NOW() as current_time');
    console.log('Current database time:', result[0][0].current_time);
  } catch (error) {
    console.error('Individual connection failed:', error.message);
    console.error('Error details:', error);
  }
}

// Function to test connection with connection string
async function testConnectionString() {
  try {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.log('No connection string available (POSTGRES_URL/DATABASE_URL not set)');
      return;
    }
    
    console.log('Testing connection with connection string');
    const sequelize = new Sequelize(connectionString, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });
    
    await sequelize.authenticate();
    console.log('Connection string connection successful!');
    
    // Test a simple query
    const result = await sequelize.query('SELECT NOW() as current_time');
    console.log('Current database time:', result[0][0].current_time);
    
    // Check if BuildItRecords tables exist
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Database tables:', tables[0].map(t => t.table_name));
  } catch (error) {
    console.error('Connection string connection failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run both tests
async function runTests() {
  await testConnectionString();
  console.log('\n-----------------------------------\n');
  await testIndividualConnection();
}

runTests().then(() => {
  console.log('All tests completed');
  process.exit(0);
}).catch(err => {
  console.error('Test script failed:', err);
  process.exit(1);
});
