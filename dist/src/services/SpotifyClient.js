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
const web_api_ts_sdk_1 = require("@spotify/web-api-ts-sdk");
class SpotifyClient {
    constructor() {
        this.clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID || '';
        this.sdk = web_api_ts_sdk_1.SpotifyApi.withClientCredentials(this.clientId, process.env.REACT_APP_SPOTIFY_CLIENT_SECRET || '');
    }
    searchTracks(query, limit = 20) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.sdk.search(query, ['track'], undefined, limit);
                return response.tracks.items;
            }
            catch (error) {
                console.error('Error searching tracks:', error);
                throw error;
            }
        });
    }
    getTrackById(trackId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.sdk.tracks.get(trackId);
            }
            catch (error) {
                console.error('Error getting track:', error);
                throw error;
            }
        });
    }
    getArtistById(artistId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.sdk.artists.get(artistId);
            }
            catch (error) {
                console.error('Error getting artist:', error);
                throw error;
            }
        });
    }
}
exports.default = new SpotifyClient();
