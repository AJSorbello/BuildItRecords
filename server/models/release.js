const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Release = sequelize.define('Release', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    spotify_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    release_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    release_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    artwork_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    spotify_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    external_urls: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    label_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    spotify_popularity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    total_tracks: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    spotify_uri: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'releases'
  });

  Release.associate = function(models) {
    Release.belongsToMany(models.Artist, {
      through: 'release_artists',
      as: 'artists',
      foreignKey: 'release_id'
    });
    
    Release.hasMany(models.Track, {
      foreignKey: 'release_id',
      as: 'tracks'
    });
  };

  return Release;
};