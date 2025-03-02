const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = (sequelize, DataTypes) => {
  class Artist extends Model {
    static associate(models) {
      Artist.belongsToMany(models.Track, {
        through: models.TrackArtist,
        foreignKey: 'artist_id',
        otherKey: 'track_id',
        as: 'tracks'
      });

      Artist.belongsToMany(models.Release, {
        through: models.ReleaseArtist,
        foreignKey: 'artist_id',
        otherKey: 'release_id',
        as: 'releases'
      });

      Artist.belongsTo(models.Label, {
        foreignKey: 'label_id',
        as: 'label'
      });

      Artist.hasMany(models.Track, {
        foreignKey: 'remixer_id',
        as: 'remixes'
      });
    }
  }

  Artist.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true
    },
    province: {
      type: DataTypes.STRING,
      allowNull: true
    },
    facebook_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    twitter_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    instagram_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    soundcloud_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    apple_music_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    display_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    spotify_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    spotify_uri: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    spotify_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    profile_image_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    profile_image_small_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    profile_image_large_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    external_urls: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    spotify_followers: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    spotify_popularity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    spotify_genres: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      defaultValue: []
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
    updatedAt: 'updated_at'
  });

  return Artist;
};