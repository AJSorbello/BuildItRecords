const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Release extends Model {}

Release.init({
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
  release_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  spotify_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  external_urls: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  external_ids: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  popularity: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  total_tracks: {
    type: DataTypes.INTEGER,
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
  modelName: 'release',
  tableName: 'releases',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Release.associate = (models) => {
  Release.belongsTo(models.Artist, {
    foreignKey: 'artist_id',
    as: 'primaryArtist'
  });
  
  Release.belongsTo(models.Label, {
    foreignKey: 'label_id',
    as: 'label'
  });
  
  Release.hasMany(models.Track, {
    foreignKey: 'release_id',
    as: 'tracks'
  });
};

module.exports = Release;