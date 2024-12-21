const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Artist extends Model {}

Artist.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  recordLabel: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'labels',
      key: 'id'
    }
  },
  spotifyUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  beatportUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  soundcloudUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bandcampUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Artist',
  tableName: 'artists',
  timestamps: true
});

module.exports = Artist;
