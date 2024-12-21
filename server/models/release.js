const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Release extends Model {}

Release.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  title: {
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
  images: {
    type: DataTypes.JSON,
    allowNull: true
  },
  artworkUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  artwork: {
    type: DataTypes.STRING,
    allowNull: true
  },
  releaseDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  genre: {
    type: DataTypes.STRING,
    allowNull: true
  },
  labelName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
