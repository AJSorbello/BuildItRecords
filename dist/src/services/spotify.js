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
exports.spotifyService = void 0;
const spotifyAuth_1 = require("../utils/spotifyAuth");
const trackUtils_1 = require("../utils/trackUtils");
class SpotifyService {
    constructor() {
        this.api = null;
        // Initialize any required properties
        this.api = null;
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
                this.api = yield (0, spotifyAuth_1.getSpotifyApi)();
            }
            return this.api;
        });
    }
    search(query, types, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const api = yield this.getApi();
                const response = yield api.search(query, types, options.market, options.limit, options.offset, options.includeExternal);
                return response;
            }
            catch (error) {
                console.error('Error searching Spotify:', error);
                throw error;
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
                throw error;
            }
        });
    }
    getArtistTopTracks(artistId, market) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const api = yield this.getApi();
                const response = yield api.artists.topTracks(artistId, market);
                return response.tracks.map(trackUtils_1.formatSpotifyTrack);
            }
            catch (error) {
                console.error('Error getting artist top tracks:', error);
                return [];
            }
        });
    }
    getArtistAlbums(artistId, market) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const api = yield this.getApi();
                const response = yield api.artists.albums(artistId, undefined, undefined, market);
                return response.items.map(trackUtils_1.formatSpotifyAlbum);
            }
            catch (error) {
                console.error('Error getting artist albums:', error);
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
                throw error;
            }
        });
    }
    getTracks(ids) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const api = yield this.getApi();
                const response = yield api.tracks.get(ids);
                return response.tracks.map(trackUtils_1.formatSpotifyTrack);
            }
            catch (error) {
                console.error('Error getting tracks:', error);
                throw error;
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
                throw error;
            }
        });
    }
}
exports.spotifyService = SpotifyService.getInstance();
