// Test script to verify API connectivity
require('dotenv').config(); // Load environment variables
const axios = require('axios');
const path = require('path');

async function testApiConnection() {
  try {
    // Print environment configuration
    console.log('===== ENVIRONMENT CONFIGURATION =====');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('API_URL:', process.env.API_URL);
    console.log('Current directory:', process.cwd());
    console.log('=====================================\n');

    // Determine API URL based on environment
    const getApiUrl = () => {
      const env = process.env.NODE_ENV || 'development';
      
      if (env === 'production') {
        return process.env.REACT_APP_API_URL || '/api';
      } else {
        // Use port 3002 for testing instead of 3001
        return process.env.API_URL || 'http://localhost:3002/api';
      }
    };

    // Force use of the newly started server on port 3002
    const baseUrl = 'http://localhost:3002/api';
    console.log('Using API base URL:', baseUrl);

    // Test the health endpoint first
    console.log('Testing health endpoint...');
    const healthEndpoint = `${baseUrl}/health`;
    console.log(`Sending GET request to: ${healthEndpoint}`);
    
    const healthResponse = await axios.get(healthEndpoint);
    console.log('✅ Health check successful!');
    console.log('Status:', healthResponse.status);
    console.log('Response:', healthResponse.data);
    
    // Test the artists endpoint with label parameter
    console.log('\nTesting artists endpoint with label parameter...');
    const artistsEndpoint = `${baseUrl}/artists/label/tech`;
    console.log(`Sending GET request to: ${artistsEndpoint}`);
    
    try {
      const artistsResponse = await axios.get(artistsEndpoint);
      console.log('✅ Successfully connected to artists API!');
      console.log('Status:', artistsResponse.status);
      console.log('Artists response structure:', Object.keys(artistsResponse.data));
      
      // Correctly access the artists array which is nested inside data.artists
      if (artistsResponse.data.success && artistsResponse.data.data && 
          artistsResponse.data.data.artists && Array.isArray(artistsResponse.data.data.artists)) {
        
        const artists = artistsResponse.data.data.artists;
        console.log('Number of artists returned:', artists.length);
      
        if (artists.length > 0) {
          // Extract the first artist
          const sampleArtist = artists[0];
          console.log('\nArtist example:', JSON.stringify(sampleArtist, null, 2));
          
          // Test fetching with UUID
          if (sampleArtist.id) {
            console.log(`\nTesting specific artist endpoint with UUID: ${sampleArtist.id}...`);
            const artistByUuidEndpoint = `${baseUrl}/artists/${sampleArtist.id}`;
            console.log(`Sending GET request to: ${artistByUuidEndpoint}`);
            
            try {
              const artistByUuidResponse = await axios.get(artistByUuidEndpoint);
              console.log('✅ Successfully fetched artist by UUID!');
              console.log('Artist name:', artistByUuidResponse.data.name);
            } catch (artistByUuidError) {
              console.error('❌ Error fetching artist by UUID:');
              if (artistByUuidError.response) {
                console.error('Response status:', artistByUuidError.response.status);
                console.error('Response data:', artistByUuidError.response.data);
              } else {
                console.error('Error message:', artistByUuidError.message);
              }
            }
          }
          
          // Test fetching with Spotify ID
          if (sampleArtist.spotify_id) {
            console.log(`\nTesting specific artist endpoint with Spotify ID: ${sampleArtist.spotify_id}...`);
            const artistBySpotifyIdEndpoint = `${baseUrl}/artists/${sampleArtist.spotify_id}`;
            console.log(`Sending GET request to: ${artistBySpotifyIdEndpoint}`);
            
            try {
              const artistBySpotifyIdResponse = await axios.get(artistBySpotifyIdEndpoint);
              console.log('✅ Successfully fetched artist by Spotify ID!');
              console.log('Artist name:', artistBySpotifyIdResponse.data.name);
            } catch (artistBySpotifyIdError) {
              console.error('❌ Error fetching artist by Spotify ID:');
              if (artistBySpotifyIdError.response) {
                console.error('Response status:', artistBySpotifyIdError.response.status);
                console.error('Response data:', artistBySpotifyIdError.response.data);
              } else {
                console.error('Error message:', artistBySpotifyIdError.message);
              }
            }
          }
        }
      } else {
        console.log('No artists returned or unexpected response format');
      }
    } catch (error) {
      console.error('❌ Error fetching artists:');
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else {
        console.error('Error message:', error.message);
      }
    }

    // Test generic tracks endpoint
    console.log('\nTesting root tracks endpoint...');
    const rootTracksEndpoint = `${baseUrl}/tracks`;
    console.log(`Sending GET request to: ${rootTracksEndpoint}`);
    
    try {
      const rootTracksResponse = await axios.get(rootTracksEndpoint);
      console.log('✅ Successfully connected to root tracks API!');
      console.log('Status:', rootTracksResponse.status);
      console.log('Response structure:', Object.keys(rootTracksResponse.data));
      if (rootTracksResponse.data.tracks) {
        console.log('Number of tracks:', rootTracksResponse.data.tracks.length);
      } else {
        console.log('No tracks array found in response');
      }
    } catch (error) {
      console.error('❌ Error fetching root tracks:');
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else {
        console.error('Error message:', error.message);
      }
    }

    // Test tracks endpoint
    console.log('\nTesting tracks endpoint with label parameter...');
    const tracksLabelId = 'buildit-tech'; // Use the full label ID from LABEL_CONFIGS
    const tracksEndpoint = `${baseUrl}/tracks/all/${tracksLabelId}`;
    console.log(`Sending GET request to: ${tracksEndpoint}`);
    
    try {
      const tracksResponse = await axios.get(tracksEndpoint);
      console.log('✅ Successfully connected to tracks API!');
      console.log('Status:', tracksResponse.status);
      console.log('Tracks data structure:', Object.keys(tracksResponse.data));
      console.log('Number of tracks:', tracksResponse.data.tracks?.length || 0);
    } catch (tracksError) {
      console.error('❌ Error fetching tracks:');
      if (tracksError.response) {
        console.error('Response status:', tracksError.response.status);
        console.error('Response data:', tracksError.response.data);
      } else {
        console.error('Error message:', tracksError.message);
      }
    }

    // Test releases endpoint
    console.log('\nTesting releases endpoint...');
    const releasesEndpoint = `${baseUrl}/releases`;
    console.log(`Sending GET request to: ${releasesEndpoint}`);
    
    try {
      const releasesResponse = await axios.get(releasesEndpoint);
      console.log('✅ Successfully connected to releases API!');
      console.log('Status:', releasesResponse.status);
      console.log('Releases data structure:', Object.keys(releasesResponse.data));
      
      // Check for different possible response formats
      if (releasesResponse.data.releases && Array.isArray(releasesResponse.data.releases)) {
        console.log('Number of releases:', releasesResponse.data.releases.length);
        
        if (releasesResponse.data.releases.length > 0) {
          const sampleRelease = releasesResponse.data.releases[0];
          console.log('\nRelease example:', JSON.stringify(sampleRelease, null, 2));
        }
      } else if (releasesResponse.data.data && 
                releasesResponse.data.data.releases && 
                Array.isArray(releasesResponse.data.data.releases)) {
        console.log('Number of releases:', releasesResponse.data.data.releases.length);
        
        if (releasesResponse.data.data.releases.length > 0) {
          const sampleRelease = releasesResponse.data.data.releases[0];
          console.log('\nRelease example:', JSON.stringify(sampleRelease, null, 2));
        }
      } else {
        console.log('Releases response format is unexpected:', JSON.stringify(releasesResponse.data, null, 2).substring(0, 300) + '...');
      }
    } catch (error) {
      console.error('❌ Error fetching releases:');
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else {
        console.error('Error message:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing API connection:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Request details:', error.request._currentUrl || error.request);
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
    }
    
    if (error.config) {
      console.error('Request URL:', error.config.url);
      console.error('Request method:', error.config.method);
    }
  }

  console.log('\n✅ API connection test complete!');
}

testApiConnection();
