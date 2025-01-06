const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Track extends Model {
    static associate(models) {
      Track.belongsTo(models.Release, {
        foreignKey: 'release_id',
        as: 'release'
      });

      Track.belongsTo(models.Artist, {
        foreignKey: 'remixer_id',
        as: 'remixer'
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
    title: {
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
    spotify_uri: {
      type: DataTypes.STRING,
      allowNull: true
    },
    release_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'releases',
        key: 'id'
      }
    },
    remixer_id: {
      type: DataTypes.STRING,
      references: {
        model: 'artists',
        key: 'id'
      }
    },
    record_label: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'record_label',
      validate: {
        isLabelFormat(value) {
          if (value && !value.match(/^label:"[^"]+?"$/)) {
            throw new Error('Record label must be in format: label:"Label Name"');
          }
        }
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
