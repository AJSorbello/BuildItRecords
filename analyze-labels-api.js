// Script to analyze artists and releases by label using the API
require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const https = require('https');

// Create an https agent that ignores SSL errors for development
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

console.log("Warning: TLS certificate validation disabled for development");

// Configuration - use the Render API URL that appears in the browser console logs
const API_BASE_URLS = [
  'https://builditrecords.onrender.com',
  'http://localhost:5176',
  'http://localhost:3001'
];

async function main() {
  // Try each API base URL until one works
  let apiBaseUrl = null;
  let connectivityTestResults = {};

  for (const baseUrl of API_BASE_URLS) {
    try {
      console.log(`Testing connectivity to ${baseUrl}...`);
      const testResponse = await axios.get(`${baseUrl}/api/health`, { 
        timeout: 5000,
        validateStatus: status => true, // Accept any status to see what we get
        httpsAgent // Use our custom https agent to bypass certificate validation
      });
      
      connectivityTestResults[baseUrl] = {
        status: testResponse.status,
        working: testResponse.status >= 200 && testResponse.status < 300,
        data: testResponse.data
      };
      
      if (testResponse.status >= 200 && testResponse.status < 300) {
        apiBaseUrl = baseUrl;
        console.log(`Successfully connected to ${baseUrl}`);
        break;
      } else {
        console.log(`API at ${baseUrl} returned status ${testResponse.status}`);
      }
    } catch (error) {
      connectivityTestResults[baseUrl] = {
        error: error.message,
        working: false
      };
      console.log(`Failed to connect to ${baseUrl}: ${error.message}`);
    }
  }

  if (!apiBaseUrl) {
    console.error('Could not connect to any API endpoint. Trying Render API as fallback.');
    apiBaseUrl = 'https://builditrecords.onrender.com';
  }

  console.log(`\nUsing API base URL: ${apiBaseUrl}`);
  
  // Create default axios config to use in all requests
  const axiosConfig = {
    timeout: 10000,
    httpsAgent
  };
  
  try {
    // First, get all labels
    console.log('Fetching labels...');
    const labelsResponse = await axios.get(`${apiBaseUrl}/api/labels`, axiosConfig);
    const labels = labelsResponse.data.data || labelsResponse.data.labels || [];
    
    if (!labels || labels.length === 0) {
      console.error('No labels found in the API response');
      return;
    }
    
    console.log(`Found ${labels.length} labels: ${labels.map(l => l.name).join(', ')}`);
    
    // For each label, count releases and artists
    const results = [];
    const artistsByLabel = {};
    
    for (const label of labels) {
      console.log(`\nProcessing label: ${label.name} (${label.id})...`);
      
      // Get releases for this label
      console.log(`Fetching releases for label ${label.name}...`);
      try {
        const releasesResponse = await axios.get(`${apiBaseUrl}/api/releases?label=${label.id}&limit=1000`, axiosConfig);
        const releases = releasesResponse.data.data || releasesResponse.data.releases || [];
        console.log(`Found ${releases.length} releases for label ${label.name}`);
        
        // Extract unique artist IDs from these releases
        const artistIdsFromReleases = new Set();
        const artistNamesFromReleases = new Set();
        
        releases.forEach(release => {
          if (release.artist_id) {
            artistIdsFromReleases.add(release.artist_id);
          }
          if (release.artist_name) {
            artistNamesFromReleases.add(release.artist_name);
          }
          if (release.artists && Array.isArray(release.artists)) {
            release.artists.forEach(artist => {
              if (typeof artist === 'object') {
                if (artist.id) artistIdsFromReleases.add(artist.id);
                if (artist.name) artistNamesFromReleases.add(artist.name);
              } else if (typeof artist === 'string') {
                artistNamesFromReleases.add(artist);
              }
            });
          }
        });
        
        // Get artists for this label directly from the API
        console.log(`Fetching artists for label ${label.name}...`);
        const artistsResponse = await axios.get(`${apiBaseUrl}/api/artists?label=${label.id}&limit=1000`, axiosConfig);
        const artists = artistsResponse.data.data || artistsResponse.data.artists || [];
        console.log(`Found ${artists.length} artists for label ${label.name} from direct API query`);
        
        // Store the artists for this label
        artistsByLabel[label.id] = artists;
        
        results.push({
          label_id: label.id,
          label_name: label.name,
          release_count: releases.length,
          artist_count: artists.length,
          artists_from_releases_count: artistIdsFromReleases.size,
          artist_names_from_releases_count: artistNamesFromReleases.size,
          artists: artists,
          releases: releases
        });
        
        console.log(`Label: ${label.name} - Found ${releases.length} releases and ${artists.length} artists directly`);
        console.log(`Label: ${label.name} - Found ${artistIdsFromReleases.size} unique artist IDs from releases`);
        console.log(`Label: ${label.name} - Found ${artistNamesFromReleases.size} unique artist names from releases`);
      } catch (error) {
        console.error(`Error fetching data for label ${label.name}:`, error.message);
      }
    }
    
    // Get total unique releases and artists
    console.log('\nFetching all releases and artists for comparison...');
    let allReleases = [];
    let allArtists = [];
    
    try {
      const allReleasesResponse = await axios.get(`${apiBaseUrl}/api/releases?limit=1000`, axiosConfig);
      allReleases = allReleasesResponse.data.data || allReleasesResponse.data.releases || [];
      console.log(`Fetched ${allReleases.length} total releases`);
    } catch (error) {
      console.error('Error fetching all releases:', error.message);
    }
    
    try {
      const allArtistsResponse = await axios.get(`${apiBaseUrl}/api/artists?limit=1000`, axiosConfig);
      allArtists = allArtistsResponse.data.data || allArtistsResponse.data.artists || [];
      console.log(`Fetched ${allArtists.length} total artists`);
    } catch (error) {
      console.error('Error fetching all artists:', error.message);
    }
    
    console.log('\n===== SUMMARY =====');
    console.log(`Total Unique Releases: ${allReleases.length}`);
    console.log(`Total Unique Artists: ${allArtists.length}`);
    console.log('\n===== LABEL COUNTS =====');
    
    // Print sorted by release count (descending)
    results.sort((a, b) => b.release_count - a.release_count);
    results.forEach(item => {
      console.log(`${item.label_name}: ${item.release_count} releases, ${item.artist_count} artists (${item.artists_from_releases_count} via release associations)`);
    });
    
    // Check for Build It Records vs Build It Deep distribution
    const buildItRecords = results.find(r => r.label_name.toLowerCase().includes('records'));
    const buildItDeep = results.find(r => r.label_name.toLowerCase().includes('deep'));
    const buildItTech = results.find(r => r.label_name.toLowerCase().includes('tech'));
    
    console.log('\n===== LABEL DISTRIBUTION ANALYSIS =====');
    
    if (buildItRecords && buildItDeep) {
      console.log(`\nBuild It Records has ${buildItRecords.release_count} releases and ${buildItRecords.artist_count} artists`);
      console.log(`Build It Deep has ${buildItDeep.release_count} releases and ${buildItDeep.artist_count} artists`);
      
      // Find artists that appear in both labels
      const recordsArtistIds = new Set(buildItRecords.artists.map(a => a.id));
      const deepArtistIds = new Set(buildItDeep.artists.map(a => a.id));
      
      const overlapArtistIds = [...recordsArtistIds].filter(id => deepArtistIds.has(id));
      console.log(`\nArtists appearing in both Build It Records and Build It Deep: ${overlapArtistIds.length}`);
      
      if (overlapArtistIds.length > 0) {
        console.log('\nOverlapping artists:');
        const overlapArtists = overlapArtistIds.map(id => {
          const artist = buildItRecords.artists.find(a => a.id === id) || 
                         buildItDeep.artists.find(a => a.id === id);
          return artist ? artist.name : `Unknown (ID: ${id})`;
        });
        overlapArtists.slice(0, 20).forEach(name => console.log(`  - ${name}`));
        if (overlapArtists.length > 20) {
          console.log(`  ... and ${overlapArtists.length - 20} more`);
        }
      }
    }
    
    if (buildItTech) {
      console.log(`\nBuild It Tech has ${buildItTech.release_count} releases and ${buildItTech.artist_count} artists`);
    }
    
    // Check for potential issues - artists missing from any label
    const allArtistIds = new Set(allArtists.map(a => a.id));
    const labelArtistIds = new Set();
    
    results.forEach(label => {
      label.artists.forEach(artist => {
        if (artist && artist.id) {
          labelArtistIds.add(artist.id);
        }
      });
    });
    
    const missingArtists = [...allArtistIds].filter(id => !labelArtistIds.has(id));
    
    console.log(`\nArtists with no label association: ${missingArtists.length}`);
    
    if (missingArtists.length > 0) {
      console.log('\nTop artists missing from label associations:');
      let missingArtistDetails = [];
      
      for (const artistId of missingArtists.slice(0, 20)) {
        try {
          const artistResponse = await axios.get(`${apiBaseUrl}/api/artist/${artistId}`, axiosConfig);
          const artist = artistResponse.data.data || artistResponse.data.artist;
          if (artist) {
            console.log(`  - ${artist.name} (ID: ${artist.id})`);
            missingArtistDetails.push(artist);
          }
        } catch (err) {
          console.log(`  - Error fetching artist with ID ${artistId}: ${err.message}`);
        }
      }
    }
    
    // Check for artists that have no releases
    console.log('\n===== ARTISTS WITH NO RELEASES =====');
    
    const artistsWithReleases = new Set();
    allReleases.forEach(release => {
      if (release.artist_id) {
        artistsWithReleases.add(release.artist_id);
      }
      if (release.artists && Array.isArray(release.artists)) {
        release.artists.forEach(artist => {
          if (typeof artist === 'object' && artist.id) {
            artistsWithReleases.add(artist.id);
          }
        });
      }
    });
    
    const artistsWithoutReleases = allArtists.filter(artist => !artistsWithReleases.has(artist.id));
    console.log(`Artists with no associated releases: ${artistsWithoutReleases.length}`);
    
    if (artistsWithoutReleases.length > 0) {
      console.log('\nSample artists with no releases:');
      artistsWithoutReleases.slice(0, 10).forEach(artist => {
        console.log(`  - ${artist.name} (ID: ${artist.id})`);
      });
    }
    
    // Write results to a file for further analysis
    console.log('\nWriting full analysis to labels-analysis.json...');
    const analysisData = {
      apiUrl: apiBaseUrl,
      connectivityTests: connectivityTestResults,
      timestamp: new Date().toISOString(),
      summary: {
        totalReleases: allReleases.length,
        totalArtists: allArtists.length,
        labelCounts: results.map(r => ({
          label_name: r.label_name,
          release_count: r.release_count,
          artist_count: r.artist_count,
          artists_from_releases_count: r.artists_from_releases_count
        }))
      },
      artistsWithoutLabels: missingArtists.length,
      artistsWithoutReleases: artistsWithoutReleases.length,
      labelOverlap: overlapArtistIds ? overlapArtistIds.length : 0
    };
    
    await fs.writeFile('labels-analysis.json', JSON.stringify(analysisData, null, 2));
    console.log('Analysis complete!');
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('API response error:', error.response.status, error.response.data);
    }
  }
}

// Run the script
main().catch(console.error);
