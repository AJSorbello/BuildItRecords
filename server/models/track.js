const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = (sequelize) => {
  class Track extends Model {
    static associate(models) {
      Track.belongsTo(models.Artist, {
        foreignKey: 'artist_id',
        as: 'artist'
      });
      Track.belongsTo(models.Artist, {
        foreignKey: 'remixer_id',
        as: 'remixer'
      });
      Track.belongsTo(models.Release, {
        foreignKey: 'release_id',
        as: 'release'
      });
    }
  }

  Track.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    spotify_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    artist_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'artists',
        key: 'id'
      }
    },
    remixer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'artists',
        key: 'id'
      }
    },
    release_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'releases',
        key: 'id'
      }
    },
    duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    preview_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    spotify_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    external_urls: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    uri: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Track',
    tableName: 'tracks',
    underscored: true,
    timestamps: true
  });

  return Track;
};
