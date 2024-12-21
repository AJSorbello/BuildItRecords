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
  spotifyUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  genres: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  followersCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  popularity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  recordLabel: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'labels',
      key: 'id'
    }
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Artist',
  tableName: 'artists',
  timestamps: true
});

module.exports = Artist;
