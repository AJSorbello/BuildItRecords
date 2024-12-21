require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'ajsorbello',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'build_it_records',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres'
  },
  test: {
    username: process.env.DB_USER || 'ajsorbello',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'build_it_records_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres'
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres'
  }
};
