const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Track extends Model {
    static associate(models) {
      Track.belongsTo(models.Release, {
        foreignKey: 'release_id',
        as: 'release'
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
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    preview_url: {
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
      allowNull: true
    },
    spotify_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    release_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Releases',
        key: 'id'
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
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    isrc: {
      type: DataTypes.STRING,
      allowNull: true
    },
    external_urls: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    spotify_popularity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    explicit: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    remixer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Artists',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'track'
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
    timestamps: false
  });

  return Track;
};
