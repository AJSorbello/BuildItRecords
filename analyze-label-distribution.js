/**
 * analyze-label-distribution.js
 * 
 * A comprehensive script to analyze artist and release distribution across
 * Build It Records and Build It Deep labels.
 * 
 * This script:
 * 1. Tests all API endpoints related to artists and releases
 * 2. Compares results from different fetch strategies
 * 3. Identifies discrepancies in artist assignment to labels
 * 4. Creates a thorough report of the distribution
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:5176'; // Using local server
const API_BACKUP_URL = 'http://localhost:3001'; // Backup URL
const CACHE_DIR = path.join(__dirname, '.cache');
const RESULTS_FILE = path.join(__dirname, 'label-distribution-results.json');
const ENABLE_VERBOSE_LOGGING = true;

// Label IDs and names for reference
const LABELS = {
  '1': { name: 'Build It Records', alias: ['buildit-records', 'records'] },
  '2': { name: 'Build It Deep', alias: ['buildit-deep', 'deep'] }
};

// Multiple endpoint formats to try
const ENDPOINT_FORMATS = [
  { label: 'numeric', transform: (id) => id },
  { label: 'string-name', transform: (id) => id === '1' ? 'buildit-records' : 'buildit-deep' },
  { label: 'string-full', transform: (id) => id === '1' ? 'Build It Records' : 'Build It Deep' },
  { label: 'simple-name', transform: (id) => id === '1' ? 'records' : 'deep' }
];

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR);
}

/**
 * Verbose logging with option to disable
 */
function verboseLog(...args) {
  if (ENABLE_VERBOSE_LOGGING) {
    console.log(...args);
  }
}

/**
 * Get cached data or fetch fresh data
 * @param {string} cacheKey - Key for cached data
 * @param {function} fetchFunction - Function to fetch fresh data
 * @param {boolean} forceRefresh - Whether to force a refresh
 */
async function getCachedOrFetch(cacheKey, fetchFunction, forceRefresh = false) {
  const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`);
  
  if (!forceRefresh && fs.existsSync(cacheFile)) {
    console.log(`Using cached data for ${cacheKey}`);
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  }
  
  console.log(`Fetching fresh data for ${cacheKey}`);
  const data = await fetchFunction();
  
  // Only cache successful responses
  if (data && (data.success || data.data || data.artists || data.releases)) {
    fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
  }
  
  return data;
}

/**
 * Try multiple base URLs until one works
 * @param {string} endpoint - API endpoint
 * @param {Object} config - Axios request config
 */
async function tryMultipleBaseUrls(endpoint, config = {}) {
  // Try the main API URL first
  try {
    verboseLog(`Trying API at: ${API_BASE_URL}${endpoint}`);
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, { 
      ...config,
      timeout: 5000 // Add timeout
    });
    verboseLog(`Success with ${API_BASE_URL}${endpoint}`);
    return response.data;
  } catch (error) {
    verboseLog(`Failed with ${API_BASE_URL}${endpoint}: ${error.message}`);
    
    // If main URL fails, try the backup URL
    try {
      verboseLog(`Trying backup API at: ${API_BACKUP_URL}${endpoint}`);
      const backupResponse = await axios.get(`${API_BACKUP_URL}${endpoint}`, {
        ...config,
        timeout: 5000 // Add timeout
      });
      verboseLog(`Success with ${API_BACKUP_URL}${endpoint}`);
      return backupResponse.data;
    } catch (backupError) {
      verboseLog(`Failed with ${API_BACKUP_URL}${endpoint}: ${backupError.message}`);
      
      // If both URLs fail, throw the original error
      throw error;
    }
  }
}

/**
 * Fetch all artists from API
 */
async function fetchAllArtists() {
  // Try multiple approaches for getting all artists
  const approaches = [
    { url: '/api/artists?limit=1000&sort=name', desc: 'Standard artists endpoint' },
    { url: '/api/artists/all', desc: 'Alternative all artists endpoint' },
    { url: '/api/all-artists', desc: 'Direct all-artists endpoint' }
  ];
  
  let lastError = null;
  
  for (const approach of approaches) {
    try {
      console.log(`Trying to fetch all artists with: ${approach.desc}`);
      const data = await tryMultipleBaseUrls(approach.url);
      
      if (data && (data.data || data.artists) && (data.data?.length > 0 || data.artists?.length > 0)) {
        return data;
      }
      
      console.log(`Approach ${approach.desc} returned no artists`);
    } catch (error) {
      console.error(`Error with ${approach.desc}:`, error.message);
      lastError = error;
    }
  }
  
  // All approaches failed
  console.error('All approaches for fetching artists failed');
  return { success: false, artists: [], error: lastError?.message };
}

/**
 * Fetch artists for a specific label
 * @param {string|number} labelId - ID of the label
 */
async function fetchArtistsByLabel(labelId) {
  let lastError = null;
  
  for (const format of ENDPOINT_FORMATS) {
    const formattedLabel = format.transform(String(labelId));
    try {
      console.log(`Trying to fetch artists for label ${labelId} as "${formattedLabel}" (${format.label})`);
      const data = await tryMultipleBaseUrls(`/api/artists?label=${encodeURIComponent(formattedLabel)}&limit=100&sort=name`);
      
      if (data && (data.data || data.artists) && (data.data?.length > 0 || data.artists?.length > 0)) {
        console.log(`Success with ${format.label} format! Found ${(data.data || data.artists).length} artists.`);
        return data;
      }
      
      console.log(`Format ${format.label} returned no artists`);
    } catch (error) {
      console.error(`Error with ${format.label} format:`, error.message);
      lastError = error;
    }
  }
  
  // If none of the label formats work, try a more direct approach
  try {
    console.log(`Trying direct label ${labelId} artists endpoint`);
    const data = await tryMultipleBaseUrls(`/api/labels/${labelId}/artists`);
    
    if (data && (data.data || data.artists) && (data.data?.length > 0 || data.artists?.length > 0)) {
      console.log(`Success with direct label artists endpoint! Found ${(data.data || data.artists).length} artists.`);
      return data;
    }
  } catch (error) {
    console.error(`Error with direct label artists endpoint:`, error.message);
    lastError = error;
  }
  
  // All approaches failed
  console.error(`All approaches for fetching artists for label ${labelId} failed`);
  return { success: false, artists: [], error: lastError?.message };
}

/**
 * Fetch releases for a specific label
 * @param {string|number} labelId - ID of the label
 */
async function fetchReleasesByLabel(labelId) {
  let lastError = null;
  
  for (const format of ENDPOINT_FORMATS) {
    const formattedLabel = format.transform(String(labelId));
    try {
      console.log(`Trying to fetch releases for label ${labelId} as "${formattedLabel}" (${format.label})`);
      const data = await tryMultipleBaseUrls(`/api/releases?label=${encodeURIComponent(formattedLabel)}&limit=100`);
      
      if (data && (data.data || data.releases) && (data.data?.length > 0 || data.releases?.length > 0)) {
        console.log(`Success with ${format.label} format! Found ${(data.data || data.releases).length} releases.`);
        return data;
      }
      
      console.log(`Format ${format.label} returned no releases`);
    } catch (error) {
      console.error(`Error with ${format.label} format:`, error.message);
      lastError = error;
    }
  }
  
  // If none of the label formats work, try a more direct approach
  try {
    console.log(`Trying direct label ${labelId} releases endpoint`);
    const data = await tryMultipleBaseUrls(`/api/labels/${labelId}/releases`);
    
    if (data && (data.data || data.releases) && (data.data?.length > 0 || data.releases?.length > 0)) {
      console.log(`Success with direct label releases endpoint! Found ${(data.data || data.releases).length} releases.`);
      return data;
    }
  } catch (error) {
    console.error(`Error with direct label releases endpoint:`, error.message);
    lastError = error;
  }
  
  // All approaches failed
  console.error(`All approaches for fetching releases for label ${labelId} failed`);
  return { success: false, releases: [], error: lastError?.message };
}

/**
 * Determine which label an artist most likely belongs to
 * @param {Object} artist - Artist object
 */
function determineArtistLabel(artist) {
  // Check artist.labels array first (most reliable)
  if (artist.labels && Array.isArray(artist.labels) && artist.labels.length > 0) {
    // If artist has both labels, check which one is primary
    const hasRecords = artist.labels.some(l => 
      l.id === '1' || l.id === 1 || 
      (l.name && LABELS['1'].alias.some(a => l.name.toLowerCase().includes(a)))
    );
    
    const hasDeep = artist.labels.some(l => 
      l.id === '2' || l.id === 2 || 
      (l.name && LABELS['2'].alias.some(a => l.name.toLowerCase().includes(a)))
    );
    
    if (hasRecords && hasDeep) {
      // Both labels present, determine primary based on name/bio mentions
      if (artist.name && artist.name.toLowerCase().includes('deep')) {
        return '2'; // Deep label
      } else if (artist.bio && artist.bio.toLowerCase().includes('build it deep')) {
        return '2'; // Deep label
      } else {
        return '1'; // Default to Records
      }
    } else if (hasDeep) {
      return '2'; // Deep label
    } else if (hasRecords) {
      return '1'; // Records label
    }
  }
  
  // Check direct labelId or label_id property
  if (artist.labelId) {
    return String(artist.labelId);
  }
  if (artist.label_id) {
    return String(artist.label_id);
  }
  
  // Check artist name or bio for label mentions
  if ((artist.name && artist.name.toLowerCase().includes('deep')) || 
      (artist.bio && artist.bio.toLowerCase().includes('build it deep'))) {
    return '2'; // Deep label
  } else if ((artist.name && artist.name.toLowerCase().includes('records')) ||
            (artist.bio && artist.bio.toLowerCase().includes('build it records'))) {
    return '1'; // Records label
  }
  
  // Default to Records if no clear indication
  return '1';
}

/**
 * Get artist releases and count by label
 * @param {string} artistId - ID of the artist
 */
async function fetchArtistReleases(artistId) {
  try {
    const response = await tryMultipleBaseUrls(`/api/artists/${artistId}/releases`);
    return response;
  } catch (error) {
    console.error(`Error fetching releases for artist ${artistId}:`, error.message);
    return { success: false, releases: [] };
  }
}

/**
 * Try accessing basic API info to test connectivity
 */
async function testApiConnection() {
  console.log('Testing API connectivity...');
  
  // Try multiple potential endpoints
  const testEndpoints = [
    '/api/health',
    '/api/status',
    '/api',
    '/api/artists?limit=1'
  ];
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      const response = await tryMultipleBaseUrls(endpoint);
      console.log(`✓ API connection successful! Response:`, response);
      return true;
    } catch (error) {
      console.log(`✗ Failed with endpoint ${endpoint}: ${error.message}`);
    }
  }
  
  console.error('❌ API connection tests failed on all endpoints');
  return false;
}

/**
 * Analyze label distribution and generate report
 */
async function analyzeDistribution() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   BUILD IT RECORDS - LABEL DISTRIBUTION ANALYSIS   ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  // First test API connectivity
  const apiConnected = await testApiConnection();
  if (!apiConnected) {
    console.error('Unable to connect to API - check if server is running correctly');
    console.log('Will attempt to continue with analysis anyway...');
  }
  
  // Fetch all data with caching
  console.log('\n--- Fetching Data ---');
  const allArtistsResponse = await getCachedOrFetch('all-artists', fetchAllArtists);
  const label1ArtistsResponse = await getCachedOrFetch('label-1-artists', () => fetchArtistsByLabel(1));
  const label2ArtistsResponse = await getCachedOrFetch('label-2-artists', () => fetchArtistsByLabel(2));
  const label1ReleasesResponse = await getCachedOrFetch('label-1-releases', () => fetchReleasesByLabel(1));
  const label2ReleasesResponse = await getCachedOrFetch('label-2-releases', () => fetchReleasesByLabel(2));
  
  // Extract arrays from responses
  const allArtists = allArtistsResponse.data || allArtistsResponse.artists || [];
  const label1Artists = label1ArtistsResponse.data || label1ArtistsResponse.artists || [];
  const label2Artists = label2ArtistsResponse.data || label2ArtistsResponse.artists || [];
  const label1Releases = label1ReleasesResponse.data || label1ReleasesResponse.releases || [];
  const label2Releases = label2ReleasesResponse.data || label2ReleasesResponse.releases || [];
  
  console.log('\n--- Data Retrieval Results ---');
  console.log(`Total artists found: ${allArtists.length}`);
  console.log(`Build It Records artists: ${label1Artists.length}`);
  console.log(`Build It Deep artists: ${label2Artists.length}`);
  console.log(`Build It Records releases: ${label1Releases.length}`);
  console.log(`Build It Deep releases: ${label2Releases.length}`);
  
  // If we have no artists, display an error and stop
  if (allArtists.length === 0 && label1Artists.length === 0 && label2Artists.length === 0) {
    console.error('\n❌ ERROR: No artists found in any API response!');
    console.log('Possible causes:');
    console.log('1. API server is not running correctly');
    console.log('2. API endpoints have changed');
    console.log('3. Database connection issues');
    
    // Save empty results
    const emptyReport = {
      timestamp: new Date().toISOString(),
      error: 'No artists found in any API response',
      apiStatus: {
        connected: apiConnected,
        endpoints: {
          allArtists: Boolean(allArtistsResponse.success),
          label1Artists: Boolean(label1ArtistsResponse.success),
          label2Artists: Boolean(label2ArtistsResponse.success),
          label1Releases: Boolean(label1ReleasesResponse.success),
          label2Releases: Boolean(label2ReleasesResponse.success)
        }
      }
    };
    
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(emptyReport, null, 2));
    console.log(`Empty results saved to ${RESULTS_FILE}`);
    return;
  }
  
  // Create maps for easier lookup
  const label1ArtistIds = new Set(label1Artists.map(a => a.id));
  const label2ArtistIds = new Set(label2Artists.map(a => a.id));
  
  // Find artists in both labels (potential duplicates)
  const artistsInBothLabels = allArtists.filter(a => 
    label1ArtistIds.has(a.id) && label2ArtistIds.has(a.id)
  );
  
  // Determine correct label for each artist
  const artists = {
    all: allArtists.map(artist => ({
      id: artist.id,
      name: artist.name,
      actualLabel: determineArtistLabel(artist),
      apiLabels: {
        inLabel1Api: label1ArtistIds.has(artist.id),
        inLabel2Api: label2ArtistIds.has(artist.id)
      },
      hasIssue: false
    }))
  };
  
  // Find misclassified artists
  artists.misclassified = artists.all.filter(artist => {
    // Artist should be in label 1 but is in label 2 API
    if (artist.actualLabel === '1' && !artist.apiLabels.inLabel1Api && artist.apiLabels.inLabel2Api) {
      artist.hasIssue = true;
      artist.issue = 'Should be in Records but only in Deep API';
      return true;
    }
    // Artist should be in label 2 but is in label 1 API
    if (artist.actualLabel === '2' && artist.apiLabels.inLabel1Api && !artist.apiLabels.inLabel2Api) {
      artist.hasIssue = true;
      artist.issue = 'Should be in Deep but only in Records API';
      return true;
    }
    // Missing from both APIs
    if (!artist.apiLabels.inLabel1Api && !artist.apiLabels.inLabel2Api) {
      artist.hasIssue = true;
      artist.issue = 'Missing from both label APIs';
      return true;
    }
    return false;
  });
  
  // Generate counts
  const counts = {
    totalArtists: allArtists.length,
    buildItRecordsArtists: label1Artists.length,
    buildItDeepArtists: label2Artists.length,
    buildItRecordsReleases: label1Releases.length,
    buildItDeepReleases: label2Releases.length,
    artistsInBothLabels: artistsInBothLabels.length,
    misclassifiedArtists: artists.misclassified.length
  };
  
  // Generate the full report
  const report = {
    timestamp: new Date().toISOString(),
    counts,
    artists,
    artistsInBothLabels
  };
  
  // Save results
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(report, null, 2));
  console.log(`\nAnalysis complete! Results saved to ${RESULTS_FILE}`);
  
  // Print summary to console
  console.log('\n----------- ANALYSIS SUMMARY -----------');
  console.log(`Total Artists: ${counts.totalArtists}`);
  console.log(`Build It Records Artists: ${counts.buildItRecordsArtists}`);
  console.log(`Build It Deep Artists: ${counts.buildItDeepArtists}`);
  console.log(`Artists in Both Labels: ${counts.artistsInBothLabels}`);
  console.log(`Misclassified Artists: ${counts.misclassifiedArtists}`);
  console.log('---------------------------------------\n');
  
  if (counts.misclassifiedArtists > 0) {
    console.log('Top 10 Misclassified Artists:');
    artists.misclassified.slice(0, 10).forEach(artist => {
      console.log(`- ${artist.name} (${artist.issue})`);
    });
  }
}

// Run the analysis
analyzeDistribution().catch(err => {
  console.error('Analysis failed:', err);
});
