"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { url } = req.body;
        const spotifyItem = extractSpotifyId(url);
        const accessToken = yield getSpotifyToken();
        let tracks = [];
        let artistGenres = [];
        // Function to get audio features for multiple tracks
        function getAudioFeatures(trackIds) {
            return __awaiter(this, void 0, void 0, function* () {
                const response = yield axios.get(`https://api.spotify.com/v1/audio-features`, {
                    params: { ids: trackIds.join(',') },
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                return response.data.audio_features;
            });
        }
        // Function to get artist details and create profile
        function getArtistDetails(artistId) {
            return __awaiter(this, void 0, void 0, function* () {
                const response = yield axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                return {
                    id: response.data.id,
                    name: response.data.name,
                    genres: response.data.genres,
                    popularity: response.data.popularity,
                    followers: response.data.followers.total,
                    images: response.data.images,
                    external_urls: response.data.external_urls
                };
            });
        }
        // Function to get artist genres
        function getArtistGenres(artistId) {
            return __awaiter(this, void 0, void 0, function* () {
                const artistDetails = yield getArtistDetails(artistId);
                return artistDetails.genres;
            });
        }
        switch (spotifyItem.type) {
            case 'track': {
                // Get single track
                const trackResponse = yield axios.get(`https://api.spotify.com/v1/tracks/${spotifyItem.id}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                // Get audio features
                const audioFeatures = yield getAudioFeatures([spotifyItem.id]);
                // Get primary artist's genres
                artistGenres = yield getArtistGenres(trackResponse.data.artists[0].id);
                tracks = [trackResponse.data];
                break;
            }
            case 'album': {
                // Get album tracks
                const albumResponse = yield axios.get(`https://api.spotify.com/v1/albums/${spotifyItem.id}/tracks`, {
                    params: { limit: 50 },
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                // Get audio features for all tracks
                const trackIds = albumResponse.data.items.map(track => track.id);
                const audioFeatures = yield getAudioFeatures(trackIds);
                // Get album details for artwork
                const albumDetails = yield axios.get(`https://api.spotify.com/v1/albums/${spotifyItem.id}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                // Add album details to each track
                tracks = albumResponse.data.items.map(track => (Object.assign(Object.assign({}, track), { album: albumDetails.data })));
                // Get all artists' details for tracks with multiple artists
                const artistProfiles = yield Promise.all(tracks[0].artists.map(artist => getArtistDetails(artist.id)));
                // If there are multiple artists, include their full profiles in the response
                if (artistProfiles.length > 1) {
                    tracks = tracks.map(track => (Object.assign(Object.assign({}, track), { artistProfiles })));
                }
                // Get primary artist's genres
                artistGenres = yield getArtistGenres(tracks[0].artists[0].id);
                break;
            }
            case 'playlist': {
                // Get playlist tracks
                const playlistResponse = yield axios.get(`https://api.spotify.com/v1/playlists/${spotifyItem.id}/tracks`, {
                    params: { limit: 50 },
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                tracks = playlistResponse.data.items.map(item => item.track);
                // Get audio features for all tracks
                const trackIds = tracks.map(track => track.id);
                const audioFeatures = yield getAudioFeatures(trackIds);
                // Get all artists' details for tracks with multiple artists
                const artistProfiles = yield Promise.all(tracks[0].artists.map(artist => getArtistDetails(artist.id)));
                // If there are multiple artists, include their full profiles in the response
                if (artistProfiles.length > 1) {
                    tracks = tracks.map(track => (Object.assign(Object.assign({}, track), { artistProfiles })));
                }
                // Get genres for the first track's artist
                artistGenres = yield getArtistGenres(tracks[0].artists[0].id);
                break;
            }
            default:
                throw new Error('Unsupported Spotify URL type');
        }
        // Get audio features for all tracks
        const trackIds = tracks.map(track => track.id);
        const audioFeatures = yield getAudioFeatures(trackIds);
        // Format and classify all tracks
        const formattedTracks = tracks.map((track, index) => formatTrackData(track, audioFeatures[index], artistGenres));
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
            organizedTracks[label].sort((a, b) => new Date(b.album.release_date) - new Date(a.album.release_date));
        }
        res.json({
            tracks: organizedTracks,
            metadata: {
                total_tracks: formattedTracks.length,
                type: spotifyItem.type
            }
        });
    }
    catch (error) {
        console.error('Error processing Spotify URL:', error);
        res.status(((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) || 500).json({
            error: 'Failed to process Spotify URL',
            message: ((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || error.message
        });
    }
}));
module.exports = router;
