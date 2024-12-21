const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Release extends Model {}

Release.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  trackTitle: {
    type: DataTypes.STRING,
    allowNull: false
  },
  artistId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'artists',
      key: 'id'
    }
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  album: {
    type: DataTypes.JSON,
    allowNull: true
  },
  spotifyUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  previewUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  recordLabel: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'labels',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Release',
  tableName: 'releases',
  timestamps: true
});

module.exports = Release;
