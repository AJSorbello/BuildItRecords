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
Object.defineProperty(exports, "__esModule", { value: true });
exports.processTracksForLabel = exports.getLabelFromTracks = exports.convertSpotifyTracksToTracks = exports.clearTrackCache = exports.getTracksByLabelId = exports.loadAllTracks = exports.getTrackLabel = exports.initializeTrackCache = exports.getTracksByAlbum = exports.getTracksByArtist = exports.getTrackById = exports.searchTracks = exports.getAllTracks = exports.refreshTrackCache = exports.sortTracksByPopularity = exports.getTrackDate = exports.isValidDate = exports.createTrack = exports.filterTracksByLabel = exports.sortTracksByDate = exports.getArtistNames = exports.getTrackImage = exports.getTracksByLabel = exports.formatTrackForLabel = exports.formatSpotifyTracks = exports.formatSpotifyTrack = exports.formatSpotifyAlbum = exports.formatSpotifyArtist = exports.formatDuration = exports.getTracksForLabel = exports.isTrack = exports.PLACEHOLDER_IMAGE = void 0;
const labels_1 = require("../constants/labels");
const spotify_1 = require("../services/spotify");
// Cache for tracks
const trackCache = new Map();
function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] ${message}`);
}
exports.PLACEHOLDER_IMAGE = '/placeholder-track.png';
const isTrack = (obj) => {
    return obj && typeof obj === 'object' &&
        'id' in obj &&
        'name' in obj &&
        'artists' in obj &&
        Array.isArray(obj.artists);
};
exports.isTrack = isTrack;
// Get tracks for a specific label
const getTracksForLabel = (labelId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check cache first
        const cachedTracks = trackCache.get(labelId);
        if (cachedTracks) {
            return cachedTracks;
        }
        // Fetch from Spotify if not in cache
        const spotifyTracks = yield spotify_1.spotifyService.getTracksByLabel(labelId);
        const tracks = formatSpotifyTracks(spotifyTracks);
        trackCache.set(labelId, tracks);
        return tracks;
    }
    catch (error) {
        log(`Error getting tracks for label ${labelId}: ${error}`, 'error');
        return [];
    }
});
exports.getTracksForLabel = getTracksForLabel;
function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
}
exports.formatDuration = formatDuration;
const formatSpotifyArtist = (artist) => {
    var _a, _b, _c, _d, _e, _f, _g;
    return ({
        id: artist.id,
        name: artist.name,
        external_urls: Object.assign({ spotify: artist.external_urls.spotify }, artist.external_urls),
        followers: {
            href: (_b = (_a = artist.followers) === null || _a === void 0 ? void 0 : _a.href) !== null && _b !== void 0 ? _b : null,
            total: (_d = (_c = artist.followers) === null || _c === void 0 ? void 0 : _c.total) !== null && _d !== void 0 ? _d : 0
        },
        genres: (_e = artist.genres) !== null && _e !== void 0 ? _e : [],
        href: artist.href,
        images: (_f = artist.images) !== null && _f !== void 0 ? _f : [],
        popularity: (_g = artist.popularity) !== null && _g !== void 0 ? _g : 0,
        type: 'artist',
        uri: artist.uri
    });
};
exports.formatSpotifyArtist = formatSpotifyArtist;
const formatSpotifyAlbum = (album) => {
    var _a, _b;
    return ({
        id: album.id,
        name: album.name,
        artwork_url: (_b = (_a = album.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url,
        images: album.images,
        release_date: album.release_date,
        external_urls: {
            spotify: album.external_urls.spotify
        },
        artists: album.artists.map(exports.formatSpotifyArtist)
    });
};
exports.formatSpotifyAlbum = formatSpotifyAlbum;
const formatSpotifyTrack = (track) => ({
    id: track.id,
    name: track.name,
    artists: track.artists.map(exports.formatSpotifyArtist),
    album: track.album ? (0, exports.formatSpotifyAlbum)(track.album) : undefined,
    external_ids: track.external_ids,
    external_urls: Object.assign({ spotify: track.external_urls.spotify }, track.external_urls),
    duration_ms: track.duration_ms,
    preview_url: track.preview_url,
    popularity: track.popularity,
    explicit: track.explicit,
    disc_number: track.disc_number,
    track_number: track.track_number,
    available_markets: track.available_markets,
    type: 'track',
    uri: track.uri,
    href: track.href,
    is_local: track.is_local
});
exports.formatSpotifyTrack = formatSpotifyTrack;
function formatSpotifyTracks(tracks) {
    return tracks.map(exports.formatSpotifyTrack);
}
exports.formatSpotifyTracks = formatSpotifyTracks;
const formatTrackForLabel = (track, label) => {
    var _a, _b, _c;
    return Object.assign(Object.assign({}, track), { release: {
            id: track.id,
            name: track.name,
            artists: track.artists,
            album: track.album,
            tracks: [track],
            external_urls: track.external_urls,
            artwork_url: (_c = (_b = (_a = track.album) === null || _a === void 0 ? void 0 : _a.images) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.url,
            spotifyUrl: track.external_urls.spotify,
            preview_url: track.preview_url,
            uri: track.uri,
            type: 'release',
            recordLabel: label.name
        } });
};
exports.formatTrackForLabel = formatTrackForLabel;
// Get tracks by label
const getTracksByLabel = (tracks, labelId) => {
    if (!labelId)
        return tracks;
    return tracks.filter(track => { var _a; return ((_a = track.label) === null || _a === void 0 ? void 0 : _a.id) === labelId; });
};
exports.getTracksByLabel = getTracksByLabel;
// Get track artwork URL
const getTrackImage = (track) => {
    var _a;
    if (track.images && track.images.length > 0) {
        return track.images[0].url;
    }
    if (((_a = track.album) === null || _a === void 0 ? void 0 : _a.images) && track.album.images.length > 0) {
        return track.album.images[0].url;
    }
    return track.artworkUrl || exports.PLACEHOLDER_IMAGE;
};
exports.getTrackImage = getTrackImage;
function getArtistNames(track) {
    return track.artists.map(artist => artist.name).join(', ');
}
exports.getArtistNames = getArtistNames;
// Sort tracks by date
function sortTracksByDate(tracks) {
    return [...tracks].sort((a, b) => {
        var _a, _b;
        const dateA = ((_a = a.album) === null || _a === void 0 ? void 0 : _a.release_date) || '';
        const dateB = ((_b = b.album) === null || _b === void 0 ? void 0 : _b.release_date) || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
}
exports.sortTracksByDate = sortTracksByDate;
// Filter tracks by label
const filterTracksByLabel = (tracks, labelId) => {
    return tracks.filter(track => { var _a; return ((_a = track.label) === null || _a === void 0 ? void 0 : _a.id) === labelId; });
};
exports.filterTracksByLabel = filterTracksByLabel;
// Create a track from partial data
const createTrack = (data) => {
    return {
        id: data.id || '',
        name: data.name || '',
        duration_ms: data.duration_ms || 0,
        preview_url: data.preview_url || null,
        external_urls: data.external_urls || { spotify: '' },
        uri: data.uri || '',
        type: 'track',
        artists: data.artists || [],
        album: data.album,
        popularity: data.popularity,
        external_ids: data.external_ids || {},
        spotifyUrl: data.spotifyUrl || '',
        label: data.label,
        recordLabel: data.recordLabel
    };
};
exports.createTrack = createTrack;
// Utility function to validate date strings
function isValidDate(dateString) {
    const d = new Date(dateString);
    return d instanceof Date && !isNaN(d.getTime());
}
exports.isValidDate = isValidDate;
// Get track date with validation
const getTrackDate = (track) => {
    var _a;
    const date = track.releaseDate || ((_a = track.album) === null || _a === void 0 ? void 0 : _a.release_date);
    return date && isValidDate(date) ? date : undefined;
};
exports.getTrackDate = getTrackDate;
// Sort tracks by popularity
const sortTracksByPopularity = (tracks) => {
    return [...tracks].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
};
exports.sortTracksByPopularity = sortTracksByPopularity;
// Refresh the track cache
const refreshTrackCache = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const labels = labels_1.RECORD_LABELS;
        yield Promise.all(labels.map((label) => __awaiter(void 0, void 0, void 0, function* () {
            const labelId = label.id || label.name;
            const spotifyTracks = yield spotify_1.spotifyService.getTracksByLabel(labelId);
            const tracks = formatSpotifyTracks(spotifyTracks);
            trackCache.set(labelId, tracks);
        })));
    }
    catch (error) {
        log(`Error refreshing track cache: ${error}`, 'error');
    }
});
exports.refreshTrackCache = refreshTrackCache;
// Get all tracks from cache
const getAllTracks = () => {
    return Array.from(trackCache.values()).flat();
};
exports.getAllTracks = getAllTracks;
// Search tracks by name
const searchTracks = (query) => {
    const normalizedQuery = query.toLowerCase();
    return (0, exports.getAllTracks)().filter(track => track.name.toLowerCase().includes(normalizedQuery) ||
        track.artists.some(artist => artist.name.toLowerCase().includes(normalizedQuery)));
};
exports.searchTracks = searchTracks;
// Get track by ID
const getTrackById = (id) => {
    return (0, exports.getAllTracks)().find(track => track.id === id);
};
exports.getTrackById = getTrackById;
// Get tracks by artist
const getTracksByArtist = (artistId) => {
    return (0, exports.getAllTracks)().filter(track => track.artists.some(artist => artist.id === artistId));
};
exports.getTracksByArtist = getTracksByArtist;
// Get tracks by album
const getTracksByAlbum = (albumId) => {
    return (0, exports.getAllTracks)().filter(track => track.album && track.album.id === albumId);
};
exports.getTracksByAlbum = getTracksByAlbum;
// Initialize the track cache
const initializeTrackCache = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (trackCache.size === 0) {
            yield (0, exports.refreshTrackCache)();
        }
        log('Track cache initialized successfully');
    }
    catch (error) {
        log('Error initializing track cache:', 'error');
        throw error;
    }
});
exports.initializeTrackCache = initializeTrackCache;
const getTrackLabel = (track) => {
    return labels_1.RECORD_LABELS.find((label) => track.recordLabel === label.name);
};
exports.getTrackLabel = getTrackLabel;
// Load tracks for all labels
const loadAllTracks = (labels) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Promise.all(labels.map((label) => __awaiter(void 0, void 0, void 0, function* () {
            const labelId = label.id || label.name;
            const spotifyTracks = yield spotify_1.spotifyService.getTracksByLabel(labelId);
            const tracks = spotifyTracks.map((track) => (0, exports.formatSpotifyTrack)(track));
            trackCache.set(labelId, tracks);
        })));
    }
    catch (error) {
        log(`Error loading tracks: ${error}`, 'error');
        throw error;
    }
});
exports.loadAllTracks = loadAllTracks;
// Get tracks for a specific label
const getTracksByLabelId = (labelId) => {
    return trackCache.get(labelId) || [];
};
exports.getTracksByLabelId = getTracksByLabelId;
// Clear the track cache
const clearTrackCache = () => {
    trackCache.clear();
};
exports.clearTrackCache = clearTrackCache;
const convertSpotifyTracksToTracks = (spotifyTracks) => {
    return spotifyTracks.map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map(artist => ({
            id: artist.id,
            name: artist.name,
            external_urls: artist.external_urls,
            uri: artist.uri,
            type: 'artist',
            spotify_url: artist.external_urls.spotify
        })),
        duration_ms: track.duration_ms,
        preview_url: track.preview_url,
        external_urls: track.external_urls,
        external_ids: track.external_ids,
        uri: track.uri,
        album: track.album ? {
            id: track.album.id,
            name: track.album.name,
            artists: track.album.artists.map(artist => ({
                id: artist.id,
                name: artist.name,
                external_urls: artist.external_urls,
                uri: artist.uri,
                type: 'artist',
                spotify_url: artist.external_urls.spotify
            })),
            images: track.album.images,
            release_date: track.album.release_date,
            release_date_precision: track.album.release_date_precision,
            total_tracks: track.album.total_tracks,
            external_urls: track.album.external_urls,
            uri: track.album.uri,
            type: 'album',
            spotifyUrl: track.album.external_urls.spotify
        } : undefined,
        popularity: track.popularity,
        spotifyUrl: track.external_urls.spotify,
        type: 'track'
    }));
};
exports.convertSpotifyTracksToTracks = convertSpotifyTracksToTracks;
const getLabelFromTracks = (tracks) => {
    const labelNames = tracks
        .map(track => track.recordLabel)
        .filter((label) => !!label);
    if (labelNames.length === 0)
        return null;
    // Get the most common label
    const labelCounts = labelNames.reduce((acc, label) => {
        acc[label] = (acc[label] || 0) + 1;
        return acc;
    }, {});
    const mostCommonLabel = Object.entries(labelCounts)
        .reduce((a, b) => a[1] > b[1] ? a : b)[0];
    return {
        id: mostCommonLabel.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: mostCommonLabel,
        displayName: mostCommonLabel
    };
};
exports.getLabelFromTracks = getLabelFromTracks;
const processTracksForLabel = (spotifyTracks, label) => {
    return (0, exports.convertSpotifyTracksToTracks)(spotifyTracks).map(track => (Object.assign(Object.assign({}, track), { recordLabel: label.name })));
};
exports.processTracksForLabel = processTracksForLabel;
