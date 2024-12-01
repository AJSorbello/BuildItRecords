const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body } = require('express-validator');
const { validateRequest } = require('../utils/validation');
const { getSpotifyToken } = require('../utils/spotify');
const { extractSpotifyId, formatTrackData } = require('../utils/trackClassifier');

// Process Spotify URL and return organized track data
router.post('/url', [
    body('url').isString().notEmpty().withMessage('Spotify URL is required'),
    validateRequest
], async (req, res) => {
    try {
        const { url } = req.body;
        const spotifyItem = extractSpotifyId(url);
        const accessToken = await getSpotifyToken();

        let tracks = [];
        let artistGenres = [];

        // Function to get audio features for multiple tracks
        async function getAudioFeatures(trackIds) {
            const response = await axios.get(
                `https://api.spotify.com/v1/audio-features`,
                {
                    params: { ids: trackIds.join(',') },
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }
            );
            return response.data.audio_features;
        }

        // Function to get artist genres
        async function getArtistGenres(artistId) {
            const response = await axios.get(
                `https://api.spotify.com/v1/artists/${artistId}`,
                {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }
            );
            return response.data.genres;
        }

        switch (spotifyItem.type) {
            case 'track': {
                // Get single track
                const trackResponse = await axios.get(
                    `https://api.spotify.com/v1/tracks/${spotifyItem.id}`,
                    {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    }
                );
                
                // Get audio features
                const audioFeatures = await getAudioFeatures([spotifyItem.id]);
                
                // Get primary artist's genres
                artistGenres = await getArtistGenres(trackResponse.data.artists[0].id);
                
                tracks = [trackResponse.data];
                break;
            }

            case 'album': {
                // Get album tracks
                const albumResponse = await axios.get(
                    `https://api.spotify.com/v1/albums/${spotifyItem.id}/tracks`,
                    {
                        params: { limit: 50 },
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    }
                );
                
                // Get audio features for all tracks
                const trackIds = albumResponse.data.items.map(track => track.id);
                const audioFeatures = await getAudioFeatures(trackIds);
                
                // Get album details for artwork
                const albumDetails = await axios.get(
                    `https://api.spotify.com/v1/albums/${spotifyItem.id}`,
                    {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    }
                );
                
                // Add album details to each track
                tracks = albumResponse.data.items.map(track => ({
                    ...track,
                    album: albumDetails.data
                }));
                
                // Get primary artist's genres
                artistGenres = await getArtistGenres(tracks[0].artists[0].id);
                break;
            }

            case 'playlist': {
                // Get playlist tracks
                const playlistResponse = await axios.get(
                    `https://api.spotify.com/v1/playlists/${spotifyItem.id}/tracks`,
                    {
                        params: { limit: 50 },
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    }
                );
                
                tracks = playlistResponse.data.items.map(item => item.track);
                
                // Get audio features for all tracks
                const trackIds = tracks.map(track => track.id);
                const audioFeatures = await getAudioFeatures(trackIds);
                
                // Get genres for the first track's artist
                artistGenres = await getArtistGenres(tracks[0].artists[0].id);
                break;
            }

            default:
                throw new Error('Unsupported Spotify URL type');
        }

        // Get audio features for all tracks
        const trackIds = tracks.map(track => track.id);
        const audioFeatures = await getAudioFeatures(trackIds);

        // Format and classify all tracks
        const formattedTracks = tracks.map((track, index) => 
            formatTrackData(track, audioFeatures[index], artistGenres)
        );

        // Organize tracks by label
        const organizedTracks = {
            BUILD_IT_RECORDS: [],
            BUILD_IT_TECH: [],
            BUILD_IT_DEEP: []
        };

        formattedTracks.forEach(track => {
            organizedTracks[track.label].push(track);
        });

        // Sort tracks by release date within each label
        for (const label of Object.keys(organizedTracks)) {
            organizedTracks[label].sort((a, b) => 
                new Date(b.album.release_date) - new Date(a.album.release_date)
            );
        }

        res.json({
            tracks: organizedTracks,
            metadata: {
                total_tracks: formattedTracks.length,
                type: spotifyItem.type
            }
        });

    } catch (error) {
        console.error('Error processing Spotify URL:', error);
        res.status(error.response?.status || 500).json({
            error: 'Failed to process Spotify URL',
            message: error.response?.data?.error?.message || error.message
        });
    }
});

module.exports = router;
