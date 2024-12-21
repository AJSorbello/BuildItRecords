const { Sequelize } = require('sequelize');
const config = require('../config/environment');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  logging: config.env === 'development' ? console.log : false,
});

// Import models
const Artist = require('./artist');
const Release = require('./release');
const Label = require('./label');

// Define associations
// Label has many Artists
Label.hasMany(Artist, {
  foreignKey: 'recordLabel',
  sourceKey: 'id'
});
Artist.belongsTo(Label, {
  foreignKey: 'recordLabel',
  targetKey: 'id'
});

// Label has many Releases
Label.hasMany(Release, {
  foreignKey: 'recordLabel',
  sourceKey: 'id'
});
Release.belongsTo(Label, {
  foreignKey: 'recordLabel',
  targetKey: 'id'
});

// Artist has many Releases
Artist.hasMany(Release, {
  foreignKey: 'artistId'
});
Release.belongsTo(Artist, {
  foreignKey: 'artistId'
});

module.exports = {
  sequelize,
  Artist,
  Release,
  Label
};
