const express = require('express');
const router = express.Router();
const SpotifyWebApi = require('spotify-web-api-node');

// Configure Spotify API
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.REACT_APP_SPOTIFY_CLIENT_ID,
    clientSecret: process.env.REACT_APP_SPOTIFY_CLIENT_SECRET,
});

let tokenExpirationTime = null;

// Function to check and refresh token if needed
async function ensureValidToken() {
    if (!tokenExpirationTime || Date.now() > tokenExpirationTime) {
        try {
            const data = await spotifyApi.clientCredentialsGrant();
            spotifyApi.setAccessToken(data.body['access_token']);
            // Set expiration time 5 minutes before actual expiration to be safe
            tokenExpirationTime = Date.now() + (data.body['expires_in'] - 300) * 1000;
            console.log('New access token acquired');
        } catch (error) {
            console.error('Error refreshing access token:', error);
            throw new Error('Failed to refresh access token');
        }
    }
}

// Helper function to extract track ID from Spotify URL
function extractTrackId(spotifyUrl) {
    try {
        const urlObj = new URL(spotifyUrl);
        if (!urlObj.hostname.includes('spotify.com')) {
            throw new Error('Not a valid Spotify URL');
        }
        const pathParts = urlObj.pathname.split('/');
        if (!pathParts.includes('track')) {
            throw new Error('Not a Spotify track URL');
        }
        return pathParts[pathParts.length - 1].split('?')[0];
    } catch (error) {
        throw new Error('Invalid URL format');
    }
}

// Endpoint to fetch track data using Spotify URL
router.get('/fetch', async (req, res) => {
    const spotifyUrl = req.query.url;
    if (!spotifyUrl) {
        return res.status(400).json({ error: 'Spotify URL is required' });
    }

    try {
        // Ensure we have a valid token
        await ensureValidToken();

        // Extract track ID from URL
        const trackId = extractTrackId(spotifyUrl);
        
        // Fetch track data
        const trackData = await spotifyApi.getTrack(trackId);
        
        // Return formatted response
        res.json({
            success: true,
            track: {
                id: trackData.body.id,
                name: trackData.body.name,
                artist: trackData.body.artists.map(artist => artist.name).join(', '),
                album: trackData.body.album.name,
                duration_ms: trackData.body.duration_ms,
                preview_url: trackData.body.preview_url,
                external_url: trackData.body.external_urls.spotify,
                album_art: trackData.body.album.images[0]?.url
            }
        });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Failed to fetch track data'
        });
    }
});

module.exports = router;
