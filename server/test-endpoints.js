const axios = require('axios');

// Test track ID - using Daft Punk's "Get Lucky" as an example
const TEST_TRACK_ID = '2Foc5Q5nqNiosCNqttzHof';
const BASE_URL = 'http://localhost:3001';

async function testEndpoints() {
    try {
        console.log('Testing single track endpoint...');
        const singleTrackResponse = await axios.get(`${BASE_URL}/api/tracks/${TEST_TRACK_ID}`);
        console.log('\nSingle Track Response:');
        console.log(JSON.stringify(singleTrackResponse.data, null, 2));

        console.log('\nTesting batch tracks endpoint...');
        const batchTrackResponse = await axios.post(`${BASE_URL}/api/tracks/batch`, {
            trackIds: [
                '2Foc5Q5nqNiosCNqttzHof', // Get Lucky
                '3MrRksHupTVEQ7YbA0FsZK'  // Billie Jean
            ]
        });
        console.log('\nBatch Tracks Response:');
        console.log(JSON.stringify(batchTrackResponse.data, null, 2));

    } catch (error) {
        console.error('Error during testing:', error.response?.data || error.message);
    }
}

testEndpoints();
