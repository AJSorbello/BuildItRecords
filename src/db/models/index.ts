import { Sequelize } from 'sequelize';
import { Track } from './Track';
import { Artist } from './Artist';
import { Release } from './Release';

export function initializeModels(sequelize: Sequelize) {
  // Initialize models
  Track.initialize(sequelize);
  Artist.initialize(sequelize);
  Release.initialize(sequelize);

  // Set up associations
  Track.associate();
  Artist.associate();
  Release.associate();

  return {
    Track,
    Artist,
    Release,
  };
}

export { Track, Artist, Release };
