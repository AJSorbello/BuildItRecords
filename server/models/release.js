const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = (sequelize) => {
  class Release extends Model {
    static associate(models) {
      Release.belongsTo(models.Artist, {
        foreignKey: 'artist_id',
        as: 'artist'
      });
      Release.belongsTo(models.Label, {
        foreignKey: 'label_id',
        as: 'label'
      });
      Release.hasMany(models.Track, {
        foreignKey: 'release_id',
        as: 'tracks'
      });
    }
  }

  Release.init({
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
    label_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'labels',
        key: 'id'
      }
    },
    release_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    cover_image_url: {
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
    external_ids: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    popularity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    total_tracks: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Release',
    tableName: 'releases',
    underscored: true,
    timestamps: true
  });

  return Release;
};