const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const sequelize = require('../config/database');

// Import model definitions
const ArtistModel = require('./artist');
const LabelModel = require('./label');
const ReleaseModel = require('./release');
const TrackModel = require('./track');
const ImportLogModel = require('./ImportLog');

// Initialize models with sequelize instance
const models = {
  Artist: ArtistModel(sequelize, DataTypes),
  Label: LabelModel(sequelize, DataTypes),
  Release: ReleaseModel(sequelize, DataTypes),
  Track: TrackModel(sequelize, DataTypes),
  ImportLog: ImportLogModel(sequelize, DataTypes)
};

// Define associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Export models and Sequelize instance
module.exports = {
  sequelize,
  Sequelize,
  ...models
};
