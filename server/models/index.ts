import { Sequelize, DataTypes, Model, ModelStatic } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'builditrecords',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: false,
      rejectUnauthorized: false,
      connectTimeout: 60000
    },
    define: {
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models
import initArtist from './artist';
import initLabel from './label';
import initRelease from './release';
import initTrack from './track';
import initImportLog from './importLog';
import initReleaseArtist from './releaseArtist';
import initTrackArtist from './trackArtist';

// Initialize models
const Artist = initArtist(sequelize);
const Label = initLabel(sequelize);
const Release = initRelease(sequelize);
const Track = initTrack(sequelize);
const ImportLog = initImportLog(sequelize);
const ReleaseArtist = initReleaseArtist(sequelize);
const TrackArtist = initTrackArtist(sequelize);

// Set up associations
const models = {
  Artist,
  Label,
  Release,
  Track,
  ImportLog,
  ReleaseArtist,
  TrackArtist,
  sequelize,
  Sequelize
};

// Define associations
Artist.belongsToMany(Release, { through: ReleaseArtist });
Release.belongsToMany(Artist, { through: ReleaseArtist });

Artist.belongsToMany(Track, { through: TrackArtist });
Track.belongsToMany(Artist, { through: TrackArtist });

Label.hasMany(Release);
Release.belongsTo(Label);

Label.hasMany(Track);
Track.belongsTo(Label);

Release.hasMany(Track);
Track.belongsTo(Release);

Label.hasMany(Artist);
Artist.belongsTo(Label);

export default models;
