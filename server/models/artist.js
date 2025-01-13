const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = (sequelize, DataTypes) => {
  class Artist extends Model {
    static associate(models) {
      Artist.belongsTo(models.Label, {
        foreignKey: 'label_id',
        as: 'label'
      });

      Artist.belongsToMany(models.Release, {
        through: 'release_artists',
        foreignKey: 'artist_id',
        otherKey: 'release_id',
        as: 'releases'
      });

      Artist.hasMany(models.Track, {
        foreignKey: 'remixer_id',
        as: 'remixes'
      });

      Artist.belongsToMany(models.Track, {
        through: 'track_artists',
        foreignKey: 'artist_id',
        otherKey: 'track_id',
        as: 'tracks'
      });
    }
  }

  Artist.init({
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    spotify_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profile_image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    spotify_uri: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isSpotifyUri(value) {
          if (value && !value.startsWith('spotify:artist:')) {
            throw new Error('Invalid Spotify URI format');
          }
        }
      }
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    label_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'labels',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }
  }, {
    sequelize,
    modelName: 'Artist',
    tableName: 'artists',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['label_id']
      },
      {
        fields: ['name']
      }
    ]
  });

  return Artist;
};