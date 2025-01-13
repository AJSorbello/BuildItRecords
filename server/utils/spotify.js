const axios = require('axios');

// Get Spotify access token
async function getSpotifyToken() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error('Missing Spotify credentials:', {
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret
        });
        throw new Error('Missing Spotify credentials');
    }

    try {
        const tokenResponse = await axios.post(
            'https://accounts.spotify.com/api/token',
            new URLSearchParams({
                grant_type: 'client_credentials'
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
                }
            }
        );

        if (!tokenResponse.data.access_token) {
            throw new Error('No access token in Spotify response');
        }

        return tokenResponse.data.access_token;
    } catch (error) {
        console.error('Error getting Spotify token:', error.response?.data || error.message);
        throw new Error('Failed to get Spotify access token');
    }
}

module.exports = {
    getSpotifyToken
};
