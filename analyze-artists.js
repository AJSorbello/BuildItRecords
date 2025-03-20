// Script to analyze artist distribution across labels using your existing DatabaseService
require('dotenv').config({ path: './.env.local' });
const fs = require('fs');

// Global variables to store our results
const labelArtistMap = {};
const allArtists = new Set();
const labelReleaseMap = {};

// Mock window.fetch for Node.js environment
global.fetch = require('node-fetch');

// Import labels data
const labelIds = [1, 2]; // Build It Records (1) and Build It Deep (2)
const labelNames = {
  1: 'Build It Records',
  2: 'Build It Deep'
};

async function fetchArtistsForLabel(labelId) {
  console.log(`Fetching artists for label: ${labelNames[labelId]} (ID: ${labelId})`);
  
  try {
    const baseUrl = 'http://localhost:5176';
    const apiUrl = `${baseUrl}/api/artists?label=${labelId}&limit=1000`;
    
    console.log(`API URL: ${apiUrl}`);
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Try multiple potential response formats
    const artists = data.data || data.artists || [];
    
    console.log(`Found ${artists.length} artists for label ${labelNames[labelId]}`);
    
    return artists;
  } catch (error) {
    console.error(`Error fetching artists for label ${labelId}:`, error.message);
    return [];
  }
}

async function fetchReleasesForLabel(labelId) {
  console.log(`Fetching releases for label: ${labelNames[labelId]} (ID: ${labelId})`);
  
  try {
    const baseUrl = 'http://localhost:5176';
    const apiUrl = `${baseUrl}/api/releases?label=${labelId}&limit=1000`;
    
    console.log(`API URL: ${apiUrl}`);
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Try multiple potential response formats
    const releases = data.data || data.releases || [];
    
    console.log(`Found ${releases.length} releases for label ${labelNames[labelId]}`);
    
    return releases;
  } catch (error) {
    console.error(`Error fetching releases for label ${labelId}:`, error.message);
    return [];
  }
}

// Try to load data from a file first to avoid calling the API repeatedly
function loadFromCache(cacheFile) {
  if (fs.existsSync(cacheFile)) {
    try {
      const content = fs.readFileSync(cacheFile, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      console.error(`Error reading cache file ${cacheFile}:`, err.message);
    }
  }
  return null;
}

function saveToCache(cacheFile, data) {
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Saved data to cache file: ${cacheFile}`);
  } catch (err) {
    console.error(`Error writing cache file ${cacheFile}:`, err.message);
  }
}

async function fetchAllArtists() {
  console.log('Fetching all artists from API');
  
  try {
    const baseUrl = 'http://localhost:5176';
    const apiUrl = `${baseUrl}/api/artists?limit=1000`;
    
    console.log(`API URL: ${apiUrl}`);
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Try multiple potential response formats
    const artists = data.data || data.artists || [];
    
    console.log(`Found ${artists.length} total artists`);
    
    return artists;
  } catch (error) {
    console.error('Error fetching all artists:', error.message);
    return [];
  }
}

async function analyzeArtistDistribution() {
  console.log('Analyzing artist distribution across labels...');
  
  // Try to load from cache first
  const cacheFile = './artist-analysis-cache.json';
  const cachedData = loadFromCache(cacheFile);
  
  let allArtistsData = [];
  let labelData = {};
  
  if (cachedData) {
    console.log('Using cached data for analysis');
    allArtistsData = cachedData.allArtists || [];
    labelData = cachedData.labelData || {};
  } else {
    // Fetch all artists first
    allArtistsData = await fetchAllArtists();
    
    // Then fetch artists and releases for each label
    labelData = {};
    
    for (const labelId of labelIds) {
      const labelArtists = await fetchArtistsForLabel(labelId);
      const labelReleases = await fetchReleasesForLabel(labelId);
      
      labelData[labelId] = {
        name: labelNames[labelId],
        artists: labelArtists,
        releases: labelReleases
      };
    }
    
    // Save to cache for future runs
    saveToCache(cacheFile, {
      allArtists: allArtistsData,
      labelData: labelData
    });
  }
  
  // Map of artist IDs to names for easy lookup
  const artistIdToName = {};
  allArtistsData.forEach(artist => {
    artistIdToName[artist.id] = artist.name;
  });
  
  // Count artists in each label
  const labelArtistCounts = {};
  for (const labelId in labelData) {
    labelArtistCounts[labelId] = labelData[labelId].artists.length;
  }
  
  // Count releases in each label
  const labelReleaseCounts = {};
  for (const labelId in labelData) {
    labelReleaseCounts[labelId] = labelData[labelId].releases.length;
  }
  
  // Artists by label
  const artistsByLabel = {};
  for (const labelId in labelData) {
    artistsByLabel[labelId] = new Set(labelData[labelId].artists.map(a => a.id));
  }
  
  // Artists in multiple labels
  const artistLabelMap = {};
  allArtistsData.forEach(artist => {
    artistLabelMap[artist.id] = [];
    for (const labelId in labelData) {
      if (artistsByLabel[labelId].has(artist.id)) {
        artistLabelMap[artist.id].push(labelId);
      }
    }
  });
  
  const multiLabelArtists = Object.entries(artistLabelMap)
    .filter(([_, labels]) => labels.length > 1)
    .map(([artistId, labels]) => ({
      id: artistId,
      name: artistIdToName[artistId],
      labels: labels.map(l => labelNames[l])
    }));
  
  // Artists with no label
  const artistsWithNoLabel = allArtistsData.filter(artist => 
    !Object.keys(artistsByLabel).some(labelId => 
      artistsByLabel[labelId].has(artist.id)
    )
  );
  
  // Print summary
  console.log('\n===== ARTIST DISTRIBUTION SUMMARY =====');
  console.log(`Total Artists: ${allArtistsData.length}`);
  
  for (const labelId in labelNames) {
    console.log(`${labelNames[labelId]}: ${labelArtistCounts[labelId] || 0} artists, ${labelReleaseCounts[labelId] || 0} releases`);
  }
  
  console.log(`\nArtists in multiple labels: ${multiLabelArtists.length}`);
  if (multiLabelArtists.length > 0) {
    console.log('\nTop artists in multiple labels:');
    multiLabelArtists.slice(0, 10).forEach(artist => {
      console.log(`- ${artist.name}: ${artist.labels.join(', ')}`);
    });
  }
  
  console.log(`\nArtists with no label: ${artistsWithNoLabel.length}`);
  if (artistsWithNoLabel.length > 0) {
    console.log('\nSample artists with no label:');
    artistsWithNoLabel.slice(0, 10).forEach(artist => {
      console.log(`- ${artist.name} (${artist.id})`);
    });
  }
  
  // Check artists that should be on Build It Deep but aren't
  // Get total unique artist count for quality check
  const uniqueArtistCount = new Set(
    Object.values(labelData).flatMap(data => 
      data.artists.map(artist => artist.id)
    )
  ).size;
  
  console.log(`\nTotal unique artists across all labels: ${uniqueArtistCount}`);
  console.log(`Difference from total artists: ${allArtistsData.length - uniqueArtistCount}`);
}

// Run the analysis
analyzeArtistDistribution().catch(console.error);
