const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Artist = sequelize.define('Artist', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
    },
    imageUrl: {
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
    labelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'labels',
        key: 'id',
      },
    },
  }, {
    tableName: 'artists',
    timestamps: true,
  });

  return Artist;
};
