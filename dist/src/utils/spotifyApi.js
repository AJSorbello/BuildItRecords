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
exports.spotifyApi = void 0;
const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1';
class SpotifyApiError extends Error {
    constructor(error) {
        super(error.message);
        this.status = error.status;
        this.name = 'SpotifyApiError';
    }
}
const handleResponse = (response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!response.ok) {
        const error = yield response.json();
        throw new SpotifyApiError({
            status: response.status,
            message: ((_a = error.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown error occurred'
        });
    }
    return response.json();
});
exports.spotifyApi = {
    getTrack(trackId, accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${SPOTIFY_BASE_URL}/tracks/${trackId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return handleResponse(response);
        });
    },
    searchTracks(query, accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = new URLSearchParams({
                q: query,
                type: 'track',
                limit: '10'
            });
            const response = yield fetch(`${SPOTIFY_BASE_URL}/search?${params}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return handleResponse(response);
        });
    },
    getUserProfile(accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${SPOTIFY_BASE_URL}/me`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return handleResponse(response);
        });
    },
    getUserPlaylists(accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${SPOTIFY_BASE_URL}/me/playlists`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return handleResponse(response);
        });
    }
};
