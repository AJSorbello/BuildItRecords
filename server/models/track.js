const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Track extends Model {
    static associate(models) {
      Track.belongsTo(models.Release, {
        foreignKey: 'release_id',
        as: 'release'
      });

      Track.belongsTo(models.Label, {
        foreignKey: 'label_id',
        as: 'label'
      });

      Track.belongsToMany(models.Artist, {
        through: models.TrackArtist,
        foreignKey: 'track_id',
        otherKey: 'artist_id',
        as: 'artists'
      });

      Track.belongsTo(models.Artist, {
        foreignKey: 'remixer_id',
        as: 'remixer'
      });
    }
  }

  Track.init({
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
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    track_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    },
    disc_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    },
    isrc: {
      type: DataTypes.STRING,
      allowNull: true
    },
    preview_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    spotify_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    spotify_uri: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isSpotifyUri(value) {
          if (value && !value.startsWith('spotify:track:')) {
            throw new Error('Invalid Spotify URI format');
          }
        }
      }
    },
    release_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'releases',
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
    remixer_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'artists',
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
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Track',
    tableName: 'tracks',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    defaultScope: {
      order: [['created_at', 'DESC']]
    }
  });

  return Track;
};
