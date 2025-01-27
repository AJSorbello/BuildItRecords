"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.databaseService = exports.DatabaseService = exports.DatabaseApiError = void 0;
const axios_1 = __importStar(require("axios"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
class DatabaseApiError extends Error {
    constructor(message, status, code) {
        super(message);
        this.status = status;
        this.code = code;
        this.name = 'DatabaseApiError';
    }
}
exports.DatabaseApiError = DatabaseApiError;
class DatabaseService {
    constructor() {
        this.baseUrl = `${config_1.API_URL}/api`;
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    request(options) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fullUrl = `${this.baseUrl}${options.url}`;
                logger_1.logger.debug('Making request:', {
                    method: options.method,
                    url: options.url,
                    baseUrl: this.baseUrl,
                    fullUrl
                });
                const response = yield (0, axios_1.default)(Object.assign(Object.assign({}, options), { url: fullUrl }));
                return response.data;
            }
            catch (error) {
                if (error instanceof axios_1.AxiosError) {
                    throw new DatabaseApiError(((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || error.message, (_c = error.response) === null || _c === void 0 ? void 0 : _c.status, (_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.code);
                }
                throw error;
            }
        });
    }
    // Labels
    getLabels() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request({
                method: 'GET',
                url: '/labels'
            });
        });
    }
    // Artists
    getArtists(params = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request({
                method: 'GET',
                url: '/artists',
                params
            });
        });
    }
    getArtistById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request({
                method: 'GET',
                url: `/artists/${id}`
            });
        });
    }
    getArtistsForLabel(labelId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request({
                method: 'GET',
                url: `/labels/${labelId}/artists`
            });
        });
    }
    // Releases
    getReleasesByLabelId(labelId, offset = 0, limit = 10) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.request({
                    method: 'GET',
                    url: '/releases',
                    params: { labelId, offset, limit }
                });
                if (!response.items) {
                    logger_1.logger.warn(`No releases found for label ${labelId}`);
                    return {
                        items: [],
                        total: 0,
                        limit,
                        offset
                    };
                }
                return response;
            }
            catch (error) {
                logger_1.logger.error('Error fetching releases:', error);
                throw this.handleError(error);
            }
        });
    }
    getReleases(label) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.request({
                    method: 'GET',
                    url: '/releases',
                    params: { label }
                });
                return response;
            }
            catch (error) {
                throw this.handleError(error);
            }
        });
    }
    // Tracks
    getTracks(labelId) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Fetching tracks for label:', labelId);
                const response = yield this.request({
                    method: 'GET',
                    url: labelId ? `/labels/${labelId}/tracks` : '/tracks'
                });
                // Validate and clean the response
                const tracks = response.tracks || [];
                return tracks.map(track => (Object.assign(Object.assign({}, track), { artists: Array.isArray(track.artists) ? track.artists.filter(a => a && a.id) : [], release: Array.isArray(track.release) ? track.release.filter(r => r && r.id) : [] })));
            }
            catch (error) {
                if (axios_1.default.isAxiosError(error)) {
                    console.error('Error fetching tracks:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                    throw new Error(((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || 'Failed to fetch tracks');
                }
                console.error('Unknown error fetching tracks:', error);
                throw new Error('An unexpected error occurred while fetching tracks');
            }
        });
    }
    getTrackById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.request({
                method: 'GET',
                url: `/tracks/${id}`
            });
            return response.track;
        });
    }
    searchTracks(query, labelId) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.request({
                method: 'GET',
                url: labelId ? `/labels/${labelId}/tracks/search` : '/tracks/search',
                params: { query }
            });
            return { tracks: response.tracks || [] };
        });
    }
    importTracksByLabel(labelId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Importing tracks for label:', {
                labelId,
                baseUrl: this.baseUrl,
                token: localStorage.getItem('adminToken') ? 'present' : 'missing'
            });
            const token = localStorage.getItem('adminToken');
            if (!token) {
                throw new Error('Admin token not found. Please log in first.');
            }
            const response = yield this.request({
                method: 'POST',
                url: `/labels/${labelId}/import`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Import response:', response);
            if (!response.tracks) {
                console.warn('No tracks in response:', response);
                return [];
            }
            return response.tracks;
        });
    }
    updateTrack(trackId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request({
                method: 'PUT',
                url: `/tracks/${trackId}`,
                data: updates
            });
        });
    }
    adminLogin(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Attempting admin login...');
            const response = yield this.request({
                method: 'POST',
                url: '/admin/login',
                data: { username, password }
            });
            console.log('Login successful, saving token');
            localStorage.setItem('adminToken', response.token);
            return response;
        });
    }
    verifyAdminToken() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Verifying admin token...');
            const token = localStorage.getItem('adminToken');
            if (!token) {
                console.log('No token found in localStorage');
                return { verified: false };
            }
            try {
                const response = yield this.request({
                    method: 'GET',
                    url: '/admin/verify-admin-token',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Token verification response:', response);
                return response;
            }
            catch (error) {
                console.error('Token verification failed:', error);
                localStorage.removeItem('adminToken');
                return { verified: false };
            }
        });
    }
    // Helper methods
    formatArtist(artist) {
        return {
            id: artist.id,
            name: artist.name,
            images: artist.images,
            external_urls: artist.external_urls,
            followers: artist.followers,
            genres: artist.genres,
            href: artist.href,
            popularity: artist.popularity,
            type: artist.type,
            uri: artist.uri
        };
    }
    formatAlbum(album, tracks) {
        return {
            id: album.id,
            name: album.name,
            images: album.images,
            artists: album.artists,
            release_date: album.release_date,
            tracks: tracks === null || tracks === void 0 ? void 0 : tracks.map(track => this.formatTrack(track)),
            external_urls: album.external_urls,
            href: album.href,
            release_date_precision: album.release_date_precision,
            total_tracks: album.total_tracks,
            type: album.type,
            uri: album.uri,
            album_type: album.album_type
        };
    }
    formatTrack(track, albumData) {
        const album = albumData ? {
            id: albumData.id,
            name: albumData.name,
            artists: albumData.artists,
            external_urls: albumData.external_urls,
            href: albumData.href,
            images: albumData.images || [],
            release_date: albumData.release_date,
            release_date_precision: albumData.release_date_precision,
            total_tracks: albumData.total_tracks,
            type: albumData.type,
            uri: albumData.uri,
            album_type: albumData.album_type
        } : track.album;
        return {
            id: track.id,
            name: track.name,
            duration_ms: track.duration_ms,
            artists: track.artists,
            album,
            preview_url: track.preview_url,
            external_urls: track.external_urls,
            external_ids: 'external_ids' in track ? track.external_ids : {},
            uri: track.uri,
            type: 'track',
            explicit: track.explicit,
            disc_number: track.disc_number,
            track_number: track.track_number,
            available_markets: track.available_markets,
            popularity: 'popularity' in track ? track.popularity : undefined
        };
    }
    formatRelease(release) {
        return {
            id: release.id,
            name: release.name,
            artists: release.artists.map(artist => this.formatArtist(artist)),
            album: this.formatAlbum(release.album, release.tracks),
            tracks: release.tracks.map(track => this.formatTrack(track, release.album)),
            external_urls: {
                spotify: release.external_urls.spotify
            }
        };
    }
    handleError(error) {
        var _a, _b, _c;
        if (axios_1.default.isAxiosError(error)) {
            const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
            const message = ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) || error.message;
            // Handle specific error cases
            if (status === 401) {
                throw new DatabaseApiError('Authentication required. Please log in again.', status);
            }
            else if (status === 404) {
                throw new DatabaseApiError('Resource not found.', status);
            }
            else if (status === 403) {
                throw new DatabaseApiError('Access denied. Insufficient permissions.', status);
            }
            throw new DatabaseApiError(message, status);
        }
        throw new DatabaseApiError('An unexpected error occurred');
    }
}
exports.DatabaseService = DatabaseService;
exports.databaseService = DatabaseService.getInstance();
