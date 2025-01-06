const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = (sequelize, DataTypes) => {
  class Artist extends Model {
    static associate(models) {
      // associations can be defined here
      Artist.belongsTo(models.Label, {
        foreignKey: 'labelId',
        as: 'label'
      });

      Artist.hasMany(models.Release, {
        foreignKey: 'primaryArtistId',
        as: 'primaryReleases'
      });

      Artist.belongsToMany(models.Release, {
        through: 'ReleaseArtists',
        foreignKey: 'artistId',
        otherKey: 'releaseId',
        as: 'releases'
      });

      Artist.hasMany(models.Track, {
        foreignKey: 'remixerId',
        as: 'remixes'
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
    spotifyUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'spotify_url',
      validate: {
        isUrl: true
      }
    },
    spotifyUri: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'spotify_uri',
      validate: {
        isSpotifyUri(value) {
          if (value && !value.startsWith('spotify:artist:')) {
            throw new Error('Invalid Spotify URI format');
          }
        }
      }
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'image_url',
      validate: {
        isUrl: true
      }
    },
    labelId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'label_id',
      references: {
        model: 'Labels',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Artist',
    tableName: 'Artists',
    underscored: true,
    timestamps: true,
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