const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Label = sequelize.define('Label', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
    logoUrl: {
      type: DataTypes.STRING,
    },
    websiteUrl: {
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
  }, {
    tableName: 'labels',
    timestamps: true,
  });

  return Label;
};
