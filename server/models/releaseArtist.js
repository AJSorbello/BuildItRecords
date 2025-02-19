'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ReleaseArtist extends Model {
    static associate(models) {
      // No associations needed for join table
    }
  }

  ReleaseArtist.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    release_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'releases',
        key: 'id'
      }
    },
    artist_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'artists',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.ENUM('primary', 'featured', 'remixer'),
      allowNull: false,
      defaultValue: 'primary'
    }
  }, {
    sequelize,
    modelName: 'ReleaseArtist',
    tableName: 'release_artists',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['release_id', 'artist_id', 'role']
      }
    ]
  });

  return ReleaseArtist;
};
