// Script to analyze artists and releases by label using only the API endpoints
require('dotenv').config();
const axios = require('axios');
const https = require('https');
const fs = require('fs').promises;

// Create an https agent that ignores SSL errors for development
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

console.log("Warning: TLS certificate validation disabled for development");

// Configuration - use multiple API URLs to try
const API_BASE_URLS = [
  'https://builditrecords.onrender.com',
  'http://localhost:5176',
  'http://localhost:3001'
];

// The labels we want to analyze - we'll need to specify them since we can't fetch a list of labels
const TARGET_LABELS = [
  { id: '1', name: 'Build It Records' },
  { id: '2', name: 'Build It Deep' },
  { id: '3', name: 'Build It Tech' }
];

// Alternative label formats that might be used in the API
const ALTERNATIVE_LABEL_FORMATS = [
  { id: '1', alternates: ['buildit-records', 'builditrecords', '1'] },
  { id: '2', alternates: ['buildit-deep', 'builditdeep', '2'] },
  { id: '3', alternates: ['buildit-tech', 'buildittech', '3'] }
];

async function main() {
  // Try each API base URL until one works
  let apiBaseUrl = null;
  let apiResults = {};

  for (const baseUrl of API_BASE_URLS) {
    console.log(`\nTesting API at ${baseUrl}...`);
    try {
      // Test if we can reach this API - use the health endpoint
      const healthResponse = await axios.get(`${baseUrl}/health`, { 
        timeout: 10000,
        httpsAgent,
        validateStatus: () => true
      });
      
      if (healthResponse.status >= 200 && healthResponse.status < 300) {
        apiBaseUrl = baseUrl;
        console.log(`Successfully connected to ${baseUrl} health endpoint`);
        break;
      } else {
        console.log(`API at ${baseUrl} returned status ${healthResponse.status}`);
        
        // Try the root endpoint as an alternative
        const rootResponse = await axios.get(`${baseUrl}/`, { 
          timeout: 5000,
          httpsAgent,
          validateStatus: () => true
        });
        
        if (rootResponse.status >= 200 && rootResponse.status < 300) {
          apiBaseUrl = baseUrl;
          console.log(`Successfully connected to ${baseUrl} root endpoint`);
          
          // If we can extract available endpoints from the response, log them
          if (rootResponse.data && rootResponse.data.endpoints) {
            console.log(`Available endpoints: ${rootResponse.data.endpoints.join(', ')}`);
          }
          
          break;
        }
      }
    } catch (error) {
      console.log(`Failed to connect to ${baseUrl}: ${error.message}`);
    }
  }

  if (!apiBaseUrl) {
    console.error('Could not connect to any API endpoint. Will use Render API as fallback.');
    apiBaseUrl = 'https://builditrecords.onrender.com';
  }

  console.log(`\nUsing API base URL: ${apiBaseUrl}`);
  
  // Common axios config
  const axiosConfig = {
    timeout: 15000, // Longer timeout for potentially slow API responses
    httpsAgent,
    validateStatus: () => true // Accept any status to handle errors gracefully
  };
  
  // Step 1: Fetch all releases and artists to get baseline counts
  console.log('\nFetching all releases and artists for baseline counts...');
  
  let allReleases = [];
  try {
    const allReleasesResponse = await axios.get(`${apiBaseUrl}/api/releases?limit=1000`, axiosConfig);
    if (allReleasesResponse.status >= 200 && allReleasesResponse.status < 300) {
      const responseData = allReleasesResponse.data;
      if (responseData.data) {
        allReleases = responseData.data;
      } else if (responseData.releases) {
        allReleases = responseData.releases;
      } else if (Array.isArray(responseData)) {
        allReleases = responseData;
      }
      
      console.log(`Found ${allReleases.length} total releases`);
    } else {
      console.error(`Error fetching all releases: Status ${allReleasesResponse.status}`, allReleasesResponse.data);
    }
  } catch (error) {
    console.error('Failed to fetch all releases:', error.message);
  }
  
  let allArtists = [];
  try {
    const allArtistsResponse = await axios.get(`${apiBaseUrl}/api/artists?limit=1000`, axiosConfig);
    if (allArtistsResponse.status >= 200 && allArtistsResponse.status < 300) {
      const responseData = allArtistsResponse.data;
      if (responseData.data) {
        allArtists = responseData.data;
      } else if (responseData.artists) {
        allArtists = responseData.artists;
      } else if (Array.isArray(responseData)) {
        allArtists = responseData;
      }
      
      console.log(`Found ${allArtists.length} total artists`);
    } else {
      console.error(`Error fetching all artists: Status ${allArtistsResponse.status}`, allArtistsResponse.data);
    }
  } catch (error) {
    console.error('Failed to fetch all artists:', error.message);
  }
  
  // Step 2: Get counts for each target label by trying different label formats
  const labelResults = {};
  
  for (const label of TARGET_LABELS) {
    console.log(`\nAnalyzing label: ${label.name} (ID: ${label.id})`);
    
    labelResults[label.id] = {
      id: label.id,
      name: label.name,
      releases: {
        count: 0,
        items: [],
        successfulFormat: null
      },
      artists: {
        count: 0,
        items: [],
        successfulFormat: null
      }
    };
    
    // Try different formats for this label ID
    const alternativeLabelFormats = ALTERNATIVE_LABEL_FORMATS.find(alt => alt.id === label.id)?.alternates || [label.id];
    
    // Get releases for this label using different format options
    let releasesFound = false;
    
    for (const labelFormat of [label.id, ...alternativeLabelFormats]) {
      if (releasesFound) break;
      
      console.log(`Trying format '${labelFormat}' for ${label.name} releases...`);
      
      try {
        const releasesResponse = await axios.get(
          `${apiBaseUrl}/api/releases?label=${encodeURIComponent(labelFormat)}&limit=1000`,
          axiosConfig
        );
        
        if (releasesResponse.status >= 200 && releasesResponse.status < 300) {
          let releases = [];
          
          if (releasesResponse.data.data) {
            releases = releasesResponse.data.data;
          } else if (releasesResponse.data.releases) {
            releases = releasesResponse.data.releases;
          } else if (Array.isArray(releasesResponse.data)) {
            releases = releasesResponse.data;
          }
          
          if (releases.length > 0) {
            labelResults[label.id].releases.count = releases.length;
            labelResults[label.id].releases.items = releases.map(r => ({ 
              id: r.id, 
              title: r.title,
              artist_id: r.artist_id,
              artist_name: r.artist_name || (r.artist ? r.artist.name : 'Unknown')
            }));
            labelResults[label.id].releases.successfulFormat = labelFormat;
            
            console.log(`Found ${releases.length} releases for label ${label.name} using format '${labelFormat}'`);
            releasesFound = true;
          } else {
            console.log(`No releases found with format '${labelFormat}'`);
          }
        } else {
          console.error(`Error fetching releases for label format '${labelFormat}': Status ${releasesResponse.status}`);
        }
      } catch (error) {
        console.error(`Failed to fetch releases for label format '${labelFormat}':`, error.message);
      }
    }
    
    if (!releasesFound) {
      console.warn(`⚠️ Could not find any releases for label ${label.name} with any format`);
    }
    
    // Get artists for this label using different format options
    let artistsFound = false;
    
    for (const labelFormat of [label.id, ...alternativeLabelFormats]) {
      if (artistsFound) break;
      
      console.log(`Trying format '${labelFormat}' for ${label.name} artists...`);
      
      try {
        const artistsResponse = await axios.get(
          `${apiBaseUrl}/api/artists?label=${encodeURIComponent(labelFormat)}&limit=1000`,
          axiosConfig
        );
        
        if (artistsResponse.status >= 200 && artistsResponse.status < 300) {
          let artists = [];
          
          if (artistsResponse.data.data) {
            artists = artistsResponse.data.data;
          } else if (artistsResponse.data.artists) {
            artists = artistsResponse.data.artists;
          } else if (Array.isArray(artistsResponse.data)) {
            artists = artistsResponse.data;
          }
          
          if (artists.length > 0) {
            labelResults[label.id].artists.count = artists.length;
            labelResults[label.id].artists.items = artists.map(a => ({ 
              id: a.id, 
              name: a.name 
            }));
            labelResults[label.id].artists.successfulFormat = labelFormat;
            
            console.log(`Found ${artists.length} artists for label ${label.name} using format '${labelFormat}'`);
            artistsFound = true;
          } else {
            console.log(`No artists found with format '${labelFormat}'`);
          }
        } else {
          console.error(`Error fetching artists for label format '${labelFormat}': Status ${artistsResponse.status}`);
        }
      } catch (error) {
        console.error(`Failed to fetch artists for label format '${labelFormat}':`, error.message);
      }
    }
    
    if (!artistsFound) {
      console.warn(`⚠️ Could not find any artists for label ${label.name} with any format`);
    }
  }
  
  // Step 3: Analyze the results
  console.log('\n===== LABEL ANALYSIS =====');
  
  // Sort labels by release count
  const sortedLabels = Object.values(labelResults).sort((a, b) => b.releases.count - a.releases.count);
  
  sortedLabels.forEach(label => {
    console.log(`${label.name}: ${label.releases.count} releases, ${label.artists.count} artists`);
    if (label.releases.successfulFormat) {
      console.log(`  Releases query format: ${label.releases.successfulFormat}`);
    }
    if (label.artists.successfulFormat) {
      console.log(`  Artists query format: ${label.artists.successfulFormat}`);
    }
  });
  
  // Map the results to our expected label names
  const buildItRecords = labelResults['1'];
  const buildItDeep = labelResults['2'];
  const buildItTech = labelResults['3'];
  
  console.log('\n===== BUILD IT LABELS ANALYSIS =====');
  
  if (buildItRecords) {
    console.log(`Build It Records: ${buildItRecords.releases.count} releases, ${buildItRecords.artists.count} artists`);
  } else {
    console.log('Build It Records label not found');
  }
  
  if (buildItDeep) {
    console.log(`Build It Deep: ${buildItDeep.releases.count} releases, ${buildItDeep.artists.count} artists`);
  } else {
    console.log('Build It Deep label not found');
  }
  
  if (buildItTech) {
    console.log(`Build It Tech: ${buildItTech.releases.count} releases, ${buildItTech.artists.count} artists`);
  } else {
    console.log('Build It Tech label not found');
  }
  
  // Find overlapping artists between labels
  console.log('\n===== ARTIST OVERLAP ANALYSIS =====');
  
  // Check for overlap between Build It Records and Build It Deep
  if (buildItRecords?.artists?.items && buildItDeep?.artists?.items) {
    const recordsArtistIds = new Set(buildItRecords.artists.items.map(a => a.id));
    const deepArtistIds = new Set(buildItDeep.artists.items.map(a => a.id));
    
    const overlappingArtistIds = [...recordsArtistIds].filter(id => deepArtistIds.has(id));
    
    console.log(`Artists appearing in both Build It Records and Build It Deep: ${overlappingArtistIds.length}`);
    
    if (overlappingArtistIds.length > 0) {
      console.log('\nSample overlapping artists:');
      const overlappingArtists = overlappingArtistIds.slice(0, 10).map(id => {
        const artist = buildItRecords.artists.items.find(a => a.id === id) || 
                       buildItDeep.artists.items.find(a => a.id === id);
        return artist ? artist.name : `Unknown (ID: ${id})`;
      });
      
      overlappingArtists.forEach(name => console.log(`  - ${name}`));
      
      if (overlappingArtistIds.length > 10) {
        console.log(`  ... and ${overlappingArtistIds.length - 10} more`);
      }
    }
  }
  
  if (buildItRecords?.artists?.items && buildItTech?.artists?.items) {
    const recordsArtistIds = new Set(buildItRecords.artists.items.map(a => a.id));
    const techArtistIds = new Set(buildItTech.artists.items.map(a => a.id));
    
    const overlappingArtistIds = [...recordsArtistIds].filter(id => techArtistIds.has(id));
    
    console.log(`Artists appearing in both Build It Records and Build It Tech: ${overlappingArtistIds.length}`);
    
    if (overlappingArtistIds.length > 0) {
      console.log('\nSample overlapping artists:');
      const overlappingArtists = overlappingArtistIds.slice(0, 10).map(id => {
        const artist = buildItRecords.artists.items.find(a => a.id === id) || 
                       buildItTech.artists.items.find(a => a.id === id);
        return artist ? artist.name : `Unknown (ID: ${id})`;
      });
      
      overlappingArtists.forEach(name => console.log(`  - ${name}`));
      
      if (overlappingArtistIds.length > 10) {
        console.log(`  ... and ${overlappingArtistIds.length - 10} more`);
      }
    }
  }
  
  if (buildItDeep?.artists?.items && buildItTech?.artists?.items) {
    const deepArtistIds = new Set(buildItDeep.artists.items.map(a => a.id));
    const techArtistIds = new Set(buildItTech.artists.items.map(a => a.id));
    
    const overlappingArtistIds = [...deepArtistIds].filter(id => techArtistIds.has(id));
    
    console.log(`Artists appearing in both Build It Deep and Build It Tech: ${overlappingArtistIds.length}`);
    
    if (overlappingArtistIds.length > 0) {
      console.log('\nSample overlapping artists:');
      const overlappingArtists = overlappingArtistIds.slice(0, 10).map(id => {
        const artist = buildItDeep.artists.items.find(a => a.id === id) || 
                       buildItTech.artists.items.find(a => a.id === id);
        return artist ? artist.name : `Unknown (ID: ${id})`;
      });
      
      overlappingArtists.forEach(name => console.log(`  - ${name}`));
      
      if (overlappingArtistIds.length > 10) {
        console.log(`  ... and ${overlappingArtistIds.length - 10} more`);
      }
    }
  }
  
  // Check for artists that don't appear in any label
  if (allArtists.length > 0) {
    console.log('\n===== ARTISTS WITHOUT LABELS =====');
    
    const allLabelArtistIds = new Set();
    Object.values(labelResults).forEach(label => {
      if (label.artists && label.artists.items) {
        label.artists.items.forEach(artist => {
          allLabelArtistIds.add(artist.id);
        });
      }
    });
    
    const artistsWithoutLabels = allArtists.filter(artist => !allLabelArtistIds.has(artist.id));
    console.log(`Artists with no label association: ${artistsWithoutLabels.length} out of ${allArtists.length} total (${((artistsWithoutLabels.length / allArtists.length) * 100).toFixed(1)}%)`);
    
    if (artistsWithoutLabels.length > 0) {
      console.log('\nSample artists with no label:');
      artistsWithoutLabels.slice(0, 10).forEach(artist => {
        console.log(`  - ${artist.name} (ID: ${artist.id})`);
      });
      
      if (artistsWithoutLabels.length > 10) {
        console.log(`  ... and ${artistsWithoutLabels.length - 10} more`);
      }
    }
  }
  
  // Write analysis results to file
  const analysisResults = {
    timestamp: new Date().toISOString(),
    apiBaseUrl,
    labelResults,
    totalReleases: allReleases.length,
    totalArtists: allArtists.length,
    buildItRecordsStats: buildItRecords || null,
    buildItDeepStats: buildItDeep || null,
    buildItTechStats: buildItTech || null,
    artistsWithoutLabelsCount: allArtists.filter(artist => !Array.from(Object.values(labelResults)).some(label => 
      label.artists && label.artists.items && label.artists.items.some(a => a.id === artist.id)
    )).length,
    recordsDeepOverlapCount: buildItRecords && buildItDeep ? 
      buildItRecords.artists.items.filter(a => buildItDeep.artists.items.some(b => b.id === a.id)).length : 0
  };
  
  try {
    await fs.writeFile('api-analysis-results.json', JSON.stringify(analysisResults, null, 2));
    console.log('\nAnalysis results saved to api-analysis-results.json');
  } catch (error) {
    console.error('Failed to save analysis results:', error.message);
  }
}

// Run the script
main().catch(console.error);
