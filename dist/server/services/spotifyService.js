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
const SpotifyWebApi = require('spotify-web-api-node');
const { Artist, Release, Track, sequelize } = require('../models');
const { Op } = require('sequelize');

// Debug: Log environment variables
console.log('Spotify Environment Variables:', {
    clientId: process.env.REACT_APP_SPOTIFY_CLIENT_ID ? 'Set' : 'Not Set',
    clientSecret: process.env.REACT_APP_SPOTIFY_CLIENT_SECRET ? 'Set' : 'Not Set',
    redirectUri: process.env.REACT_APP_SPOTIFY_REDIRECT_URI ? 'Set' : 'Not Set'
});

// Known Build It Tech release IDs on Spotify
const BUILD_IT_TECH_RELEASES = [
    '6h3XmMGEhl4pPqX6ZheNUQ', // City High (Radio Edit)
    // Add more release IDs here as they are released
];

// Known Build It Deep release IDs on Spotify
const BUILD_IT_DEEP_RELEASES = [
// Add Build It Deep release IDs here
];

class SpotifyService {
    constructor(clientId, clientSecret, redirectUri) {
        console.log('Creating SpotifyService instance with:', {
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
            hasRedirectUri: !!redirectUri
        });
        
        this.spotifyApi = new SpotifyWebApi({
            clientId,
            clientSecret,
            redirectUri
        });
        this._initialized = false;
    }

    isInitialized() {
        return this._initialized;
    }

    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Initializing Spotify API...');
                const data = yield this.spotifyApi.clientCredentialsGrant();
                console.log('Got Spotify access token:', {
                    token: data.body['access_token'].substring(0, 10) + '...',
                    expiresIn: data.body['expires_in']
                });
                this.spotifyApi.setAccessToken(data.body['access_token']);
                this._initialized = true;
                console.log('Spotify API initialized successfully');
            }
            catch (error) {
                console.error('Failed to initialize Spotify API:', error);
                throw error;
            }
        });
    }

    getAlbumById(albumId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this._initialized || !this.spotifyApi.getAccessToken()) {
                    console.log('Spotify API not initialized, initializing now...');
                    yield this.initialize();
                }
                console.log('Fetching album by ID:', albumId);
                const result = yield this.spotifyApi.getAlbum(albumId);
                if (!result.body) {
                    console.error('No album data in response:', result);
                    return null;
                }
                console.log('Found album:', {
                    name: result.body.name,
                    label: result.body.label,
                    artists: result.body.artists.map(a => a.name)
                });
                return result.body;
            }
            catch (error) {
                console.error('Error fetching album by ID:', error);
                throw error;
            }
        });
    }

    searchAlbumsByLabel(labelName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Ensure we have a valid token
                if (!this._initialized || !this.spotifyApi.getAccessToken()) {
                    console.log('Spotify API not initialized, initializing now...');
                    yield this.initialize();
                }
                console.log(`Searching for releases from label: ${labelName}`);
                const albums = [];
                let offset = 0;
                const limit = 50; // Maximum allowed by Spotify
                let total = null;
                do {
                    console.log(`Fetching releases from offset ${offset}`);
                    // Search for albums with the label name
                    const searchResults = yield this.spotifyApi.searchAlbums(`label:"${labelName}"`, {
                        limit: limit,
                        offset: offset
                    });
                    if (!searchResults.body || !searchResults.body.albums) {
                        console.log('No search results found');
                        break;
                    }
                    // Set total on first iteration
                    if (total === null) {
                        total = searchResults.body.albums.total;
                        console.log(`Total releases found: ${total}`);
                    }
                    // Process each album from the search results
                    for (const item of searchResults.body.albums.items) {
                        try {
                            // Get full album details
                            const album = yield this.getAlbumById(item.id);
                            if (album && album.label === labelName) {
                                albums.push(album);
                                console.log(`Added album: ${album.name}`);
                            }
                            else if (album) {
                                console.log(`Album ${item.id} has label "${album.label}", expected "${labelName}"`);
                            }
                        }
                        catch (error) {
                            console.error(`Error fetching album ${item.id}:`, error);
                        }
                    }
                    // Move to next page
                    offset += limit;
                    // Add a small delay to avoid rate limiting
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                } while (offset < total);
                console.log(`Found ${albums.length} releases for label: ${labelName}`);
                return albums;
            }
            catch (error) {
                console.error('Error searching albums by label:', error);
                throw error;
            }
        });
    }

    importReleases(label, albums) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`Importing ${albums.length} releases for label: ${label.name}`);
                const importedReleases = [];
                for (const albumData of albums) {
                    try {
                        // Get full album details
                        const fullAlbum = yield this.spotifyApi.getAlbum(albumData.id);
                        const releaseData = fullAlbum.body;
                        console.log('Processing release:', {
                            name: releaseData.name,
                            id: releaseData.id,
                            type: releaseData.album_type,
                            total_tracks: releaseData.total_tracks,
                            artists: releaseData.artists.map(a => a.name),
                            label: releaseData.label
                        });
                        // Process artists
                        const artistPromises = releaseData.artists.map((artistData) => __awaiter(this, void 0, void 0, function* () {
                            var _a;
                            try {
                                // Get full artist details including images
                                const artistDetails = yield this.spotifyApi.getArtist(artistData.id);
                                const artistImages = artistDetails.body.images || [];
                                const profileImage = artistImages.length > 0 ? artistImages[0].url : null;
                                const [artist] = yield Artist.findOrCreate({
                                    where: { id: artistData.id },
                                    defaults: {
                                        id: artistData.id,
                                        name: artistData.name,
                                        spotify_url: (_a = artistData.external_urls) === null || _a === void 0 ? void 0 : _a.spotify,
                                        profile_image: profileImage,
                                        label_id: label.id
                                    }
                                });
                                return artist;
                            }
                            catch (error) {
                                console.error(`Error saving artist ${artistData.name}:`, error);
                                return null;
                            }
                        }));
                        const savedArtists = (yield Promise.all(artistPromises)).filter(a => a !== null);
                        if (savedArtists.length === 0) {
                            console.log(`Skipping release ${releaseData.name} - no artists could be saved`);
                            continue;
                        }
                        // Get the primary artist (first artist)
                        const primaryArtist = savedArtists[0];
                        // Parse release date with proper precision handling
                        let releaseDate = null;
                        if (releaseData.release_date) {
                            switch (releaseData.release_date_precision) {
                                case 'day':
                                    releaseDate = releaseData.release_date;
                                    break;
                                case 'month':
                                    releaseDate = `${releaseData.release_date}-01`;
                                    break;
                                case 'year':
                                    releaseDate = `${releaseData.release_date}-01-01`;
                                    break;
                            }
                        }
                        // Get highest quality artwork
                        const artworkUrl = releaseData.images && releaseData.images.length > 0
                            ? releaseData.images.sort((a, b) => b.width - a.width)[0].url
                            : null;
                        // Create the release
                        const [release] = yield Release.findOrCreate({
                            where: { id: releaseData.id },
                            defaults: {
                                id: releaseData.id,
                                name: releaseData.name,
                                release_date: releaseDate,
                                spotify_url: releaseData.external_urls.spotify,
                                spotify_uri: releaseData.uri,
                                artwork_url: artworkUrl,
                                label_id: label.id,
                                primary_artist_id: primaryArtist.id,
                                total_tracks: releaseData.total_tracks
                            }
                        });
                        console.log('Saved release:', release.name);
                        // Associate all artists with the release
                        yield release.setArtists(savedArtists.map(a => a.id));
                        // Process tracks
                        if (releaseData.tracks && releaseData.tracks.items) {
                            const trackPromises = releaseData.tracks.items.map((trackData) => __awaiter(this, void 0, void 0, function* () {
                                try {
                                    const [track] = yield Track.findOrCreate({
                                        where: { id: trackData.id },
                                        defaults: {
                                            id: trackData.id,
                                            name: trackData.name,
                                            duration: trackData.duration_ms,
                                            preview_url: trackData.preview_url,
                                            spotify_url: trackData.external_urls.spotify,
                                            spotify_uri: trackData.uri,
                                            release_id: release.id,
                                            label_id: label.id,
                                            track_number: trackData.track_number,
                                            disc_number: trackData.disc_number
                                        }
                                    });
                                    // Associate track with release artists
                                    yield track.setArtists(savedArtists.map(a => a.id));
                                    console.log('Saved track:', track.name);
                                    return track;
                                }
                                catch (error) {
                                    console.error(`Error saving track ${trackData.name}:`, error);
                                    return null;
                                }
                            }));
                            yield Promise.all(trackPromises);
                        }
                        importedReleases.push(release);
                    }
                    catch (error) {
                        console.error(`Error processing album ${albumData.id}:`, error);
                        continue;
                    }
                }
                return importedReleases;
            }
            catch (error) {
                console.error('Error importing releases:', error);
                throw error;
            }
        });
    }

    getServerSideToken() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Getting server-side token...');
                if (!this._initialized || !this.spotifyApi.getAccessToken()) {
                    console.log('API not initialized, initializing now...');
                    yield this.initialize();
                }
                const token = this.spotifyApi.getAccessToken();
                console.log('Got server-side token:', token ? 'Present' : 'Missing');
                return token;
            } catch (error) {
                console.error('Error getting server-side token:', error);
                throw error;
            }
        });
    }

    getPlaylistTracks(playlistId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this._initialized || !this.spotifyApi.getAccessToken()) {
                    yield this.initialize();
                }

                console.log('Fetching tracks for playlist:', playlistId);
                const tracks = [];
                let offset = 0;
                const limit = 50;
                let total = null;

                do {
                    const response = yield this.spotifyApi.getPlaylistTracks(playlistId, {
                        offset: offset,
                        limit: limit,
                        fields: 'items(track(id,name,duration_ms,track_number,disc_number,preview_url,external_urls,uri,artists,album)),total'
                    });

                    if (!response.body || !response.body.items) {
                        console.log('No tracks found in playlist');
                        break;
                    }

                    if (total === null) {
                        total = response.body.total;
                        console.log(`Total tracks in playlist: ${total}`);
                    }

                    const validTracks = response.body.items
                        .filter(item => item && item.track)
                        .map(item => ({
                            id: item.track.id,
                            name: item.track.name,
                            duration_ms: item.track.duration_ms,
                            track_number: item.track.track_number,
                            disc_number: item.track.disc_number,
                            preview_url: item.track.preview_url,
                            external_urls: item.track.external_urls,
                            uri: item.track.uri,
                            artists: item.track.artists,
                            album: item.track.album
                        }));

                    tracks.push(...validTracks);
                    offset += limit;

                    // Add a small delay to avoid rate limiting
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                } while (offset < total);

                console.log(`Found ${tracks.length} tracks in playlist`);
                return tracks;
            } catch (error) {
                console.error('Error fetching playlist tracks:', error);
                throw error;
            }
        });
    }
}

// Create a singleton instance
const spotifyService = new SpotifyService(
    process.env.REACT_APP_SPOTIFY_CLIENT_ID,
    process.env.REACT_APP_SPOTIFY_CLIENT_SECRET,
    process.env.REACT_APP_SPOTIFY_REDIRECT_URI
);

module.exports = spotifyService;
