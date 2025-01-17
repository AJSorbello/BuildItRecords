"use strict";
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config();
// Create Sequelize instance
const sequelize = new Sequelize(process.env.DB_NAME || 'builditrecords', process.env.DB_USER || 'postgres', process.env.DB_PASSWORD || 'postgres', {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
        } : false,
        connectTimeout: 60000
    },
    define: {
        underscored: true,
        underscoredAll: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});
// Import model definitions
const ArtistModel = require('./artist');
const LabelModel = require('./label');
const ReleaseModel = require('./release');
const TrackModel = require('./track');
const ImportLogModel = require('./importLog');
const ReleaseArtistModel = require('./releaseArtist');
const TrackArtistModel = require('./trackArtist');
// Debug: Log model imports
console.log('Model imports:', {
    ArtistModel: !!ArtistModel,
    LabelModel: !!LabelModel,
    ReleaseModel: !!ReleaseModel,
    TrackModel: !!TrackModel,
    ImportLogModel: !!ImportLogModel,
    ReleaseArtistModel: !!ReleaseArtistModel,
    TrackArtistModel: !!TrackArtistModel
});
// Initialize models with sequelize instance
const models = {
    Artist: ArtistModel(sequelize, DataTypes),
    Label: LabelModel(sequelize, DataTypes),
    Release: ReleaseModel(sequelize, DataTypes),
    Track: TrackModel(sequelize, DataTypes),
    ImportLog: ImportLogModel(sequelize, DataTypes),
    ReleaseArtist: ReleaseArtistModel(sequelize, DataTypes),
    TrackArtist: TrackArtistModel(sequelize, DataTypes)
};
// Debug: Log initialized models
console.log('Initialized models:', {
    Artist: !!models.Artist,
    Label: !!models.Label,
    Release: !!models.Release,
    Track: !!models.Track,
    ImportLog: !!models.ImportLog,
    ReleaseArtist: !!models.ReleaseArtist,
    TrackArtist: !!models.TrackArtist
});
// Define associations
Object.keys(models).forEach((modelName) => {
    if (models[modelName].associate) {
        console.log('Associating model:', modelName);
        models[modelName].associate(models);
    }
});
// Debug: Log models after associations
console.log('Models after associations:', {
    Artist: !!models.Artist,
    Label: !!models.Label,
    Release: !!models.Release,
    Track: !!models.Track,
    ImportLog: !!models.ImportLog,
    ReleaseArtist: !!models.ReleaseArtist,
    TrackArtist: !!models.TrackArtist
});
// Export models and Sequelize instance
module.exports = {
    sequelize,
    Sequelize,
    models
};
