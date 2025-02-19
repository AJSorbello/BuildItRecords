'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class TrackArtist extends Model {
    static associate(models) {
      // No associations needed for join table
    }
  }

  TrackArtist.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    track_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tracks',
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
    modelName: 'TrackArtist',
    tableName: 'track_artists',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['track_id', 'artist_id', 'role']
      }
    ]
  });

  return TrackArtist;
};
