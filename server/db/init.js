const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');
const seedDatabase = require('./seeds');

async function initializeDatabase() {
  try {
    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Drop and recreate tables
    await sequelize.query(schema);
    console.log('[Database] Schema initialized successfully');

    // Seed the database
    await seedDatabase();
    console.log('[Database] Initial data seeded successfully');

    console.log('[Database] Connection established successfully');
  } catch (error) {
    console.error('[Database] Error initializing database:', error);
    throw error;
  }
}

module.exports = initializeDatabase;
