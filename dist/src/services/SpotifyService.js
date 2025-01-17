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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spotifyService = exports.SpotifyService = exports.SPOTIFY_CONFIG = void 0;
const web_api_ts_sdk_1 = require("@spotify/web-api-ts-sdk");
const axios_1 = __importDefault(require("axios"));
const trackUtils_1 = require("../utils/trackUtils");
exports.SPOTIFY_CONFIG = {
    labels: {
        'buildit-tech': {
            name: 'Build It Tech',
            artists: []
        },
        'buildit-records': {
            name: 'Build It Records',
            artists: []
        },
        'buildit-deep': {
            name: 'Build It Deep',
            artists: []
        }
    },
    BUILD_IT_TECH_RELEASES: [
        '6h3XmMGEhl4pPqX6ZheNUQ', // City High (Radio Edit)
    ]
};
class SpotifyService {
    constructor() {
        this.api = null;
        this.clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID || '';
        this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
        this.redirectUri = process.env.REACT_APP_SPOTIFY_REDIRECT_URI || '';
    }
    static getInstance() {
        if (!SpotifyService.instance) {
            SpotifyService.instance = new SpotifyService();
        }
        return SpotifyService.instance;
    }
    getApi() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.api) {
                this.api = web_api_ts_sdk_1.SpotifyApi.withUserAuthorization(this.clientId, this.redirectUri, ['user-read-private', 'user-read-email', 'playlist-read-private']);
            }
            return this.api;
        });
    }
    getServerSideToken() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.clientId || !this.clientSecret) {
                console.error('Missing Spotify credentials:', {
                    hasClientId: !!this.clientId,
                    hasClientSecret: !!this.clientSecret
                });
                throw new Error('Missing Spotify credentials');
            }
            try {
                const tokenResponse = yield axios_1.default.post('https://accounts.spotify.com/api/token', new URLSearchParams({
                    grant_type: 'client_credentials'
                }).toString(), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
                    }
                });
                if (!tokenResponse.data.access_token) {
                    throw new Error('No access token in Spotify response');
                }
                return tokenResponse.data.access_token;
            }
            catch (error) {
                console.error('Error getting Spotify token:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error('Failed to get Spotify access token');
            }
        });
    }
    searchTracks(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const api = yield this.getApi();
                const response = yield api.search(query, ['track']);
                return response.tracks.items.map(trackUtils_1.formatSpotifyTrack);
            }
            catch (error) {
                console.error('Error searching tracks:', error);
                return [];
            }
        });
    }
    getTrack(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const api = yield this.getApi();
                const track = yield api.tracks.get(id);
                return (0, trackUtils_1.formatSpotifyTrack)(track);
            }
            catch (error) {
                console.error('Error getting track:', error);
                return null;
            }
        });
    }
    getArtist(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const api = yield this.getApi();
                const artist = yield api.artists.get(id);
                return (0, trackUtils_1.formatSpotifyArtist)(artist);
            }
            catch (error) {
                console.error('Error getting artist:', error);
                return null;
            }
        });
    }
    getAlbum(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const api = yield this.getApi();
                const album = yield api.albums.get(id);
                return (0, trackUtils_1.formatSpotifyAlbum)(album);
            }
            catch (error) {
                console.error('Error getting album:', error);
                return null;
            }
        });
    }
    getPlaylistTracks(playlistId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const api = yield this.getApi();
                const response = yield api.playlists.getPlaylistItems(playlistId);
                return response.items
                    .filter(item => item.track.type === 'track')
                    .map(item => (0, trackUtils_1.formatSpotifyTrack)(item.track));
            }
            catch (error) {
                console.error('Error getting playlist tracks:', error);
                return [];
            }
        });
    }
    getLabelByName(name) {
        return Object.values(exports.SPOTIFY_CONFIG.labels).find(label => label.name === name);
    }
}
exports.SpotifyService = SpotifyService;
exports.spotifyService = SpotifyService.getInstance();
