'use strict';

module.exports = (sequelize, DataTypes) => {
  const ImportLog = sequelize.define('ImportLog', {
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['artist', 'release', 'track']]
      }
    },
    spotifyId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['success', 'error']]
      }
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    importedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    indexes: [
      {
        fields: ['type', 'spotifyId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['importedAt']
      }
    ]
  });

  return ImportLog;
};
