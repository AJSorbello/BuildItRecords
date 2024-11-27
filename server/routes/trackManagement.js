const express = require('express');
const router = express.Router();
const { verifyToken } = require('./admin');
const SpotifyWebApi = require('spotify-web-api-node');

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.REACT_APP_SPOTIFY_CLIENT_ID,
    clientSecret: process.env.REACT_APP_SPOTIFY_CLIENT_SECRET,
});

let tokenExpirationTime = null;

// Function to check and refresh token if needed
async function ensureValidToken() {
    console.log('Checking Spotify token...');
    if (!tokenExpirationTime || Date.now() > tokenExpirationTime) {
        try {
            console.log('Getting new Spotify token...');
            const data = await spotifyApi.clientCredentialsGrant();
            spotifyApi.setAccessToken(data.body['access_token']);
            tokenExpirationTime = Date.now() + (data.body['expires_in'] - 300) * 1000;
            console.log('New Spotify token acquired');
        } catch (error) {
            console.error('Error refreshing Spotify token:', error);
            throw new Error('Failed to refresh Spotify token');
        }
    }
}

// Function to extract track ID from Spotify URL
function extractTrackId(spotifyUrl) {
    try {
        // Handle both URL formats:
        // https://open.spotify.com/track/1234...
        // spotify:track:1234...
        if (spotifyUrl.includes('spotify:track:')) {
            return spotifyUrl.split('spotify:track:')[1];
        }
        const url = new URL(spotifyUrl);
        const pathParts = url.pathname.split('/');
        const trackId = pathParts[pathParts.indexOf('track') + 1];
        if (!trackId) {
            throw new Error('No track ID found in URL');
        }
        return trackId;
    } catch (error) {
        console.error('Error extracting track ID:', error);
        throw new Error('Invalid Spotify URL format');
    }
}

// In-memory storage (replace with database in production)
let tracks = [];

// Add a new track
router.post('/tracks', verifyToken, async (req, res) => {
    console.log('Add track request received:', req.body);
    const { spotifyUrl, category } = req.body;

    if (!spotifyUrl) {
        return res.status(400).json({ success: false, error: 'Spotify URL is required' });
    }

    try {
        await ensureValidToken();
        const trackId = extractTrackId(spotifyUrl);
        console.log('Extracted track ID:', trackId);

        const trackData = await spotifyApi.getTrack(trackId);
        console.log('Retrieved track data from Spotify');

        const track = {
            id: trackData.body.id,
            name: trackData.body.name,
            artist: trackData.body.artists.map(artist => artist.name).join(', '),
            album: trackData.body.album.name,
            albumArt: trackData.body.album.images[0]?.url,
            spotifyUrl,
            category,
            addedAt: new Date(),
            addedBy: req.user.username
        };

        tracks.push(track);
        console.log('Track added successfully:', track.name);
        res.json({ success: true, track });
    } catch (error) {
        console.error('Error adding track:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to add track',
            details: error.response?.body || error.toString()
        });
    }
});

// Get all tracks
router.get('/tracks', async (req, res) => {
    try {
        res.json({ success: true, tracks });
    } catch (error) {
        console.error('Error fetching tracks:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch tracks' });
    }
});

// Delete a track
router.delete('/tracks/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    console.log('Delete track request:', id);
    
    const initialLength = tracks.length;
    tracks = tracks.filter(track => track.id !== id);
    
    if (tracks.length === initialLength) {
        console.log('Track not found for deletion:', id);
        return res.status(404).json({ success: false, error: 'Track not found' });
    }
    
    console.log('Track deleted successfully:', id);
    res.json({ success: true, message: 'Track deleted successfully' });
});

// Update track category
router.put('/tracks/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const { category } = req.body;
    console.log('Update track request:', { id, category });
    
    const track = tracks.find(t => t.id === id);
    if (!track) {
        console.log('Track not found for update:', id);
        return res.status(404).json({ success: false, error: 'Track not found' });
    }
    
    track.category = category;
    console.log('Track updated successfully:', track.name);
    res.json({ success: true, track });
});

module.exports = router;
