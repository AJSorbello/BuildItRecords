const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Track extends Model {
    static associate(models) {
      // associations can be defined here
      Track.belongsTo(models.Release, {
        foreignKey: 'release_id',
        as: 'release'
      });

      Track.belongsTo(models.Label, {
        foreignKey: 'label_id',
        as: 'label'
      });

      Track.belongsToMany(models.Artist, {
        through: 'track_artists',
        foreignKey: 'track_id',
        otherKey: 'artist_id',
        as: 'artists'
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
      allowNull: true
    },
    spotify_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    release_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'releases',
        key: 'id'
      }
    },
    label_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'labels',
        key: 'id'
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
    timestamps: true
  });

  return Track;
};
