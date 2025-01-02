const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      freezeTableName: true,
      underscored: true
    }
  }
);

// Initialize database and create default labels if they don't exist
const initializeDatabase = async () => {
  try {
    console.log('[Database] Testing connection...');
    await sequelize.authenticate();
    console.log('[Database] Connection established successfully');

    // Import models
    const Label = require('../models/label');
    const Artist = require('../models/artist');
    const Release = require('../models/release');
    const Track = require('../models/track');

    // Define associations with unique aliases
    Artist.belongsTo(Label, {
      foreignKey: 'record_label',
      targetKey: 'id',
      as: 'recording_label'
    });
    Label.hasMany(Artist, {
      foreignKey: 'record_label',
      sourceKey: 'id',
      as: 'label_artists'
    });

    Release.belongsTo(Label, {
      foreignKey: 'label_id',
      targetKey: 'id',
      as: 'release_label'
    });
    Label.hasMany(Release, {
      foreignKey: 'label_id',
      sourceKey: 'id',
      as: 'label_releases'
    });

    Track.belongsTo(Label, {
      foreignKey: 'label_id',
      targetKey: 'id',
      as: 'track_label'
    });
    Label.hasMany(Track, {
      foreignKey: 'label_id',
      sourceKey: 'id',
      as: 'label_tracks'
    });

    Release.belongsTo(Artist, {
      foreignKey: 'artist_id',
      targetKey: 'id',
      as: 'release_artist'
    });
    Artist.hasMany(Release, {
      foreignKey: 'artist_id',
      sourceKey: 'id',
      as: 'artist_releases'
    });

    console.log('[Database] Syncing models...');
    await sequelize.sync({ alter: true });
    console.log('[Database] Models synced successfully');

    // Create default labels if they don't exist
    const defaultLabels = [
      {
        id: 'buildit-records',
        name: 'Build It Records',
        display_name: 'Build It Records',
        slug: 'buildit-records'
      },
      {
        id: 'buildit-tech',
        name: 'Build It Tech',
        display_name: 'Build It Tech',
        slug: 'buildit-tech'
      },
      {
        id: 'buildit-deep',
        name: 'Build It Deep',
        display_name: 'Build It Deep',
        slug: 'buildit-deep'
      }
    ];

    console.log('[Database] Creating default labels...');
    for (const labelData of defaultLabels) {
      try {
        // First try to find the label
        let label = await Label.findOne({
          where: { id: labelData.id }
        });

        if (!label) {
          // If label doesn't exist, create it
          label = await Label.create({
            id: labelData.id,
            name: labelData.name,
            display_name: labelData.display_name,
            slug: labelData.slug
          });
          console.log(`[Database] Created label: ${label.name}`);
        } else {
          // If label exists, update it
          await label.update({
            name: labelData.name,
            display_name: labelData.display_name,
            slug: labelData.slug
          });
          console.log(`[Database] Updated label: ${label.name}`);
        }
      } catch (error) {
        console.error(`[Database] Error with label ${labelData.name}:`, error);
        throw error;
      }
    }
    console.log('[Database] Default labels created/updated successfully');

  } catch (error) {
    console.error('[Database] Failed to initialize:', error);
    throw error;
  }
};

// Initialize database when this module is imported
initializeDatabase().catch(error => {
  console.error('[Database] Fatal error during initialization:', error);
  process.exit(1);
});

module.exports = sequelize;
