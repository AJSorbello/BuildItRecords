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
const Label = require('./label')(sequelize);
const Artist = require('./artist')(sequelize);
const Release = require('./release')(sequelize);

// Define associations
Label.hasMany(Artist, { foreignKey: 'labelId', as: 'artists' });
Artist.belongsTo(Label, { foreignKey: 'labelId', as: 'label' });

Artist.hasMany(Release, { foreignKey: 'artistId', as: 'releases' });
Release.belongsTo(Artist, { foreignKey: 'artistId', as: 'artist' });

Label.hasMany(Release, { foreignKey: 'labelId', as: 'releases' });
Release.belongsTo(Label, { foreignKey: 'labelId', as: 'label' });

module.exports = {
  sequelize,
  Label,
  Artist,
  Release,
};
