const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Release = sequelize.define('Release', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    releaseDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    albumArtUrl: {
      type: DataTypes.STRING,
    },
    spotifyId: {
      type: DataTypes.STRING,
    },
    spotifyUrl: {
      type: DataTypes.STRING,
    },
    beatportUrl: {
      type: DataTypes.STRING,
    },
    soundcloudUrl: {
      type: DataTypes.STRING,
    },
    artistId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'artists',
        key: 'id',
      },
    },
    labelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'labels',
        key: 'id',
      },
    },
    popularity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    tableName: 'releases',
    timestamps: true,
  });

  return Release;
};
