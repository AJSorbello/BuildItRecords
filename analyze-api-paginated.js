// Script to analyze artists and releases by label using paginated API calls to ensure we get all data
require('dotenv').config();
const axios = require('axios');
const https = require('https');
const fs = require('fs').promises;

// Create an https agent that ignores SSL errors for development
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

console.log("Warning: TLS certificate validation disabled for development");

// Configuration
const API_BASE_URL = 'https://builditrecords.onrender.com';
const PAGE_SIZE = 50; // Smaller page size to avoid timeout issues
const MAX_PAGES = 20;  // Maximum number of pages to fetch to avoid infinite loops

// The labels we want to analyze
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

// Common axios config
const axiosConfig = {
  timeout: 30000, // Longer timeout for potentially slow API responses
  httpsAgent,
  validateStatus: () => true // Accept any status to handle errors gracefully
};

// Helper function to fetch all pages of data from an API endpoint
async function fetchAllPages(baseUrl, params = {}) {
  const allItems = [];
  let page = 0;
  let hasMore = true;
  let totalFetched = 0;
  
  console.log(`Fetching all pages from ${baseUrl} with params:`, params);
  
  while (hasMore && page < MAX_PAGES) {
    const pageParams = {
      ...params,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE
    };
    
    // Convert params object to URL query string
    const queryString = Object.entries(pageParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    const url = `${baseUrl}?${queryString}`;
    console.log(`Fetching page ${page + 1} from ${url}`);
    
    try {
      const response = await axios.get(url, axiosConfig);
      
      if (response.status >= 200 && response.status < 300) {
        let items = [];
        
        // Try to extract items from different response formats
        if (response.data.data) {
          items = response.data.data;
        } else if (response.data.releases) {
          items = response.data.releases;
        } else if (response.data.artists) {
          items = response.data.artists;
        } else if (Array.isArray(response.data)) {
          items = response.data;
        }
        
        if (items.length > 0) {
          console.log(`Page ${page + 1} returned ${items.length} items`);
          allItems.push(...items);
          totalFetched += items.length;
          
          // Check if we should continue pagination
          hasMore = items.length === PAGE_SIZE;
          page++;
        } else {
          console.log(`Page ${page + 1} returned 0 items, stopping pagination`);
          hasMore = false;
        }
      } else {
        console.error(`Error fetching page ${page + 1}: Status ${response.status}`, response.data);
        hasMore = false;
      }
    } catch (error) {
      console.error(`Failed to fetch page ${page + 1}:`, error.message);
      hasMore = false;
    }
  }
  
  console.log(`Finished fetching ${totalFetched} total items from ${baseUrl}`);
  return allItems;
}

// Analyze the release data to extract type information
function analyzeReleaseTypes(releases) {
  // Try to determine release type from available fields
  const typeMap = {};
  const titlePatterns = {
    single: /\bsingle\b/i,
    ep: /\bep\b/i,
    compilation: /\b(compilation|collection|best of|vol\.)\b/i
  };
  
  releases.forEach(release => {
    // Check for explicit release_type field
    let type = release.release_type?.toLowerCase();
    
    // If no explicit type, try to infer from title
    if (!type) {
      if (titlePatterns.single.test(release.title)) {
        type = 'single';
      } else if (titlePatterns.ep.test(release.title)) {
        type = 'ep';
      } else if (titlePatterns.compilation.test(release.title)) {
        type = 'compilation';
      } else {
        type = 'album'; // Default assumption
      }
    }
    
    if (!typeMap[type]) {
      typeMap[type] = { count: 0, examples: [] };
    }
    
    typeMap[type].count++;
    if (typeMap[type].examples.length < 5) {
      typeMap[type].examples.push({
        id: release.id,
        title: release.title
      });
    }
  });
  
  return typeMap;
}

async function main() {
  console.log(`\nUsing API base URL: ${API_BASE_URL}`);
  
  // Step 1: Fetch all releases and artists to get baseline counts
  console.log('\nFetching ALL releases (paginated)...');
  const allReleases = await fetchAllPages(`${API_BASE_URL}/api/releases`);
  console.log(`Total releases found: ${allReleases.length}`);
  
  // Analyze release types
  const releaseTypeAnalysis = analyzeReleaseTypes(allReleases);
  console.log('\n===== RELEASE TYPE ANALYSIS =====');
  Object.entries(releaseTypeAnalysis).forEach(([type, data]) => {
    console.log(`${type}: ${data.count} releases`);
    if (data.examples.length > 0) {
      console.log('  Examples:');
      data.examples.forEach(example => {
        console.log(`  - ${example.title} (ID: ${example.id})`);
      });
    }
  });
  
  console.log('\nFetching ALL artists (paginated)...');
  const allArtists = await fetchAllPages(`${API_BASE_URL}/api/artists`);
  console.log(`Total artists found: ${allArtists.length}`);
  
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
    let labelReleases = [];
    
    for (const labelFormat of [label.id, ...alternativeLabelFormats]) {
      if (releasesFound) break;
      
      console.log(`Trying format '${labelFormat}' for ${label.name} releases...`);
      
      try {
        labelReleases = await fetchAllPages(`${API_BASE_URL}/api/releases`, { label: labelFormat });
        
        if (labelReleases.length > 0) {
          labelResults[label.id].releases.count = labelReleases.length;
          labelResults[label.id].releases.items = labelReleases.map(r => ({ 
            id: r.id, 
            title: r.title,
            release_type: r.release_type,
            artist_id: r.artist_id || (r.artist ? r.artist.id : null),
            artist_name: r.artist_name || (r.artist ? r.artist.name : 'Unknown')
          }));
          labelResults[label.id].releases.successfulFormat = labelFormat;
          
          console.log(`Found ${labelReleases.length} releases for label ${label.name} using format '${labelFormat}'`);
          releasesFound = true;
        } else {
          console.log(`No releases found with format '${labelFormat}'`);
        }
      } catch (error) {
        console.error(`Failed to fetch releases for label format '${labelFormat}':`, error.message);
      }
    }
    
    if (!releasesFound) {
      console.warn(`⚠️ Could not find any releases for label ${label.name} with any format`);
    } else {
      // Analyze types of releases for this label
      const labelReleaseTypes = analyzeReleaseTypes(labelReleases);
      console.log(`\n${label.name} Release Types:`);
      Object.entries(labelReleaseTypes).forEach(([type, data]) => {
        console.log(`  ${type}: ${data.count} releases`);
      });
    }
    
    // Get artists for this label using different format options
    let artistsFound = false;
    
    for (const labelFormat of [label.id, ...alternativeLabelFormats]) {
      if (artistsFound) break;
      
      console.log(`Trying format '${labelFormat}' for ${label.name} artists...`);
      
      try {
        const labelArtists = await fetchAllPages(`${API_BASE_URL}/api/artists`, { label: labelFormat });
        
        if (labelArtists.length > 0) {
          labelResults[label.id].artists.count = labelArtists.length;
          labelResults[label.id].artists.items = labelArtists.map(a => ({ 
            id: a.id, 
            name: a.name 
          }));
          labelResults[label.id].artists.successfulFormat = labelFormat;
          
          console.log(`Found ${labelArtists.length} artists for label ${label.name} using format '${labelFormat}'`);
          artistsFound = true;
        } else {
          console.log(`No artists found with format '${labelFormat}'`);
        }
      } catch (error) {
        console.error(`Failed to fetch artists for label format '${labelFormat}':`, error.message);
      }
    }
    
    if (!artistsFound) {
      console.warn(`⚠️ Could not find any artists for label ${label.name} with any format`);
    }
  }
  
  // Step A: Analyze database statistics vs API results
  console.log('\n===== DATABASE VS API COMPARISON =====');
  console.log(`API returned ${allReleases.length} total releases`);
  console.log(`API returned ${allArtists.length} total artists`);
  console.log(`(Note: PostgreSQL query showed 174 releases and 203 artists)`);
  
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
    apiBaseUrl: API_BASE_URL,
    totalReleasesAPI: allReleases.length,
    totalArtistsAPI: allArtists.length,
    databaseStats: {
      releases: 174, // From PostgreSQL query
      artists: 203   // From PostgreSQL query
    },
    releaseTypeAnalysis,
    labelResults,
    buildItRecordsStats: buildItRecords || null,
    buildItDeepStats: buildItDeep || null,
    buildItTechStats: buildItTech || null
  };
  
  try {
    await fs.writeFile('api-paginated-analysis-results.json', JSON.stringify(analysisResults, null, 2));
    console.log('\nAnalysis results saved to api-paginated-analysis-results.json');
  } catch (error) {
    console.error('Failed to save analysis results:', error.message);
  }
}

// Run the script
main().catch(console.error);
