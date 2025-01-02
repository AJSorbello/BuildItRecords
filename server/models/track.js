const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Track extends Model {}

Track.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  artist_id: {
    type: DataTypes.STRING,
    references: {
      model: 'artists',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  release_id: {
    type: DataTypes.STRING,
    references: {
      model: 'releases',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  label_id: {
    type: DataTypes.STRING,
    references: {
      model: 'labels',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    allowNull: true
  },
  duration_ms: {
    type: DataTypes.INTEGER,
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
  external_urls: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  uri: {
    type: DataTypes.STRING,
    allowNull: true
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
  modelName: 'track',
  tableName: 'tracks',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Track;
