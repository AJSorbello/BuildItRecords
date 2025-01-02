const sequelize = require('../config/database');

// Import models
const Artist = require('./artist');
const Release = require('./release');
const Label = require('./label');
const Track = require('./track');

// Define associations
// Label has many Artists
Label.hasMany(Artist, {
  foreignKey: 'label_id',
  sourceKey: 'id',
  as: 'artists'
});
Artist.belongsTo(Label, {
  foreignKey: 'label_id',
  targetKey: 'id',
  as: 'label'
});

// Label has many Releases
Label.hasMany(Release, {
  foreignKey: 'label_id',
  sourceKey: 'id',
  as: 'releases'
});
Release.belongsTo(Label, {
  foreignKey: 'label_id',
  targetKey: 'id',
  as: 'label'
});

// Artist has many Releases
Artist.hasMany(Release, {
  foreignKey: 'artist_id',
  sourceKey: 'id',
  as: 'releases'
});
Release.belongsTo(Artist, {
  foreignKey: 'artist_id',
  targetKey: 'id',
  as: 'artist'
});

// Release has many Tracks
Release.hasMany(Track, {
  foreignKey: 'release_id',
  sourceKey: 'id',
  as: 'tracks'
});
Track.belongsTo(Release, {
  foreignKey: 'release_id',
  targetKey: 'id',
  as: 'release'
});

// Track belongs to Artist
Track.belongsTo(Artist, {
  foreignKey: 'artist_id',
  targetKey: 'id',
  as: 'artist'
});

// Track belongs to Label
Track.belongsTo(Label, {
  foreignKey: 'label_id',
  targetKey: 'id',
  as: 'label'
});

// Export models and sequelize instance
module.exports = {
  sequelize,
  Artist,
  Release,
  Label,
  Track
};
