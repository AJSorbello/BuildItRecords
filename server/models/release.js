const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = (sequelize) => {
  class Release extends Model {
    static associate(models) {
      // associations can be defined here
      Release.belongsTo(models.Label, {
        foreignKey: 'labelId',
        as: 'label'
      });

      Release.belongsTo(models.Artist, {
        foreignKey: 'primaryArtistId',
        as: 'primaryArtist'
      });

      Release.belongsToMany(models.Artist, {
        through: 'ReleaseArtists',
        foreignKey: 'releaseId',
        otherKey: 'artistId',
        as: 'artists'
      });

      Release.hasMany(models.Track, {
        foreignKey: 'releaseId',
        as: 'tracks'
      });
    }
  }

  Release.init({
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    releaseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'release_date'
    },
    type: {
      type: DataTypes.ENUM('album', 'single', 'ep'),
      allowNull: false,
      defaultValue: 'single',
      validate: {
        isIn: [['album', 'single', 'ep']]
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
          if (value && !value.startsWith('spotify:album:')) {
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
      allowNull: false,
      field: 'label_id',
      references: {
        model: 'Labels',
        key: 'id'
      }
    },
    primaryArtistId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'primary_artist_id',
      references: {
        model: 'Artists',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'published'),
      allowNull: false,
      defaultValue: 'draft',
      validate: {
        isIn: [['draft', 'scheduled', 'published']]
      }
    }
  }, {
    sequelize,
    modelName: 'Release',
    tableName: 'Releases',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['label_id']
      },
      {
        fields: ['primary_artist_id']
      },
      {
        fields: ['release_date']
      },
      {
        fields: ['status']
      }
    ],
    hooks: {
      beforeValidate: (release) => {
        if (release.releaseDate && release.releaseDate instanceof Date) {
          release.releaseDate = release.releaseDate.toISOString().split('T')[0];
        }
      }
    }
  });

  return Release;
};