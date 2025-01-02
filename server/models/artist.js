const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = (sequelize) => {
  class Artist extends Model {
    static associate(models) {
      Artist.belongsTo(models.Label, {
        foreignKey: 'label_id',
        as: 'label'
      });
      Artist.hasMany(models.Release, {
        foreignKey: 'artist_id',
        as: 'releases'
      });
      Artist.hasMany(models.Track, {
        foreignKey: 'artist_id',
        as: 'tracks'
      });
    }
  }

  Artist.init({
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    label_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'labels',
        key: 'id'
      }
    },
    spotify_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Artist',
    tableName: 'artists',
    underscored: true,
    timestamps: true
  });

  return Artist;
};