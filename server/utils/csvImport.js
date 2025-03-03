const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');
const logger = require('./logger');

function removeBOM(str) {
  if (str.charCodeAt(0) === 0xFEFF) {
    return str.slice(1);
  }
  return str;
}

async function readTracksFromCSV(filePath) {
  try {
    // Read file content and remove BOM
    const fileContent = removeBOM(fs.readFileSync(filePath, 'utf8'));
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true, // Be more lenient with quotes
      skip_records_with_error: true // Skip problematic rows
    });

    // Map records to our format
    const tracks = records.map(row => ({
      label: row['Label Name'],
      catalog: row['Catalog #'],
      upc: row['UPC'],
      release_name: row['Release Name'],
      release_version: row['Release Version'],
      release_artist: row['Release Artist'],
      release_date: row['Release Date'],
      track_number: row['Track'],
      isrc: row['ISRC'],
      name: row['Song Name'],
      mix_version: row['Mix Version'],
      primary_artists: row['Primary Artists']?.split(',').map(a => a.trim()).filter(Boolean) || [],
      featuring_artists: row['Featuring Artists']?.split(',').map(a => a.trim()).filter(Boolean) || [],
      remixers: row['Remixers']?.split(',').map(a => a.trim()).filter(Boolean) || [],
      duration: row['Track Length'],
      genre: row['Song Genre'],
      subgenre: row['Song Subgenre']
    }));

    logger.info(`Read ${tracks.length} tracks from CSV`);
    return tracks;
  } catch (error) {
    logger.error('Error reading CSV:', error);
    throw error;
  }
}

async function getTracksByLabel(labelName) {
  const csvPath = path.join(__dirname, '../../src/assets/csv/builditaj_InventoryExport_2024-11-26_18_11_03.csv');
  const tracks = await readTracksFromCSV(csvPath);
  
  // Filter tracks by label and group by release (UPC)
  const releaseMap = new Map();
  tracks
    .filter(track => track.label === labelName)
    .forEach(track => {
      if (!releaseMap.has(track.upc)) {
        releaseMap.set(track.upc, {
          name: track.release_name,
          upc: track.upc,
          catalog: track.catalog,
          release_date: track.release_date,
          artist: track.release_artist,
          tracks: []
        });
      }
      releaseMap.get(track.upc).tracks.push(track);
    });
  
  return Array.from(releaseMap.values());
}

module.exports = {
  readTracksFromCSV,
  getTracksByLabel
};
