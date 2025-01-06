const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = (sequelize) => {
  class Release extends Model {
    static associate(models) {
      // associations can be defined here
      Release.belongsTo(models.Label, {
        foreignKey: 'label_id',
        as: 'label'
      });

      Release.belongsTo(models.Artist, {
        foreignKey: 'primary_artist_id',
        as: 'primaryArtist'
      });

      Release.belongsToMany(models.Artist, {
        through: 'release_artists',
        foreignKey: 'release_id',
        otherKey: 'artist_id',
        as: 'artists'
      });

      Release.hasMany(models.Track, {
        foreignKey: 'release_id',
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
    release_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    cover_image: {
      type: DataTypes.STRING
    },
    spotify_url: {
      type: DataTypes.STRING,
      validate: {
        isUrl: true
      }
    },
    spotify_uri: {
      type: DataTypes.STRING,
      validate: {
        isSpotifyUri(value) {
          if (value && !value.startsWith('spotify:album:')) {
            throw new Error('Invalid Spotify URI format');
          }
        }
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
    primary_artist_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'artists',
        key: 'id'
      }
    },
    total_tracks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    record_label: {
      type: DataTypes.STRING,
      validate: {
        isLabelFormat(value) {
          if (value && !value.match(/^label:"[^"]+?"$/)) {
            throw new Error('Record label must be in format: label:"Label Name"');
          }
        }
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
    tableName: 'releases',
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
        if (release.release_date && release.release_date instanceof Date) {
          release.release_date = release.release_date.toISOString().split('T')[0];
        }
      }
    }
  });

  return Release;
};