const { Sequelize } = require('sequelize');
const config = require('./environment');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  logging: config.env === 'development' ? console.log : false,
});

module.exports = sequelize;
