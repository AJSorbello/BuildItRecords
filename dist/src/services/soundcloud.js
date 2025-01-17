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
exports.soundcloudService = void 0;
const axios_1 = __importDefault(require("axios"));
const SOUNDCLOUD_CLIENT_ID = process.env.REACT_APP_SOUNDCLOUD_CLIENT_ID || '';
class SoundCloudService {
    constructor() {
        this.baseUrl = 'https://api.soundcloud.com';
        if (!SOUNDCLOUD_CLIENT_ID) {
            console.warn('SoundCloud client ID not provided');
        }
        this.clientId = SOUNDCLOUD_CLIENT_ID;
    }
    static getInstance() {
        if (!SoundCloudService.instance) {
            SoundCloudService.instance = new SoundCloudService();
        }
        return SoundCloudService.instance;
    }
    getHeaders() {
        return {
            'Authorization': `OAuth ${this.clientId}`,
        };
    }
    getTrack(trackId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(`${this.baseUrl}/tracks/${trackId}`, {
                    headers: this.getHeaders(),
                });
                return response.data;
            }
            catch (error) {
                console.error('Error fetching SoundCloud track:', error);
                throw error;
            }
        });
    }
    searchTracks(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(`${this.baseUrl}/tracks`, {
                    headers: this.getHeaders(),
                    params: {
                        q: query,
                        client_id: this.clientId,
                    },
                });
                return response.data;
            }
            catch (error) {
                console.error('Error searching SoundCloud tracks:', error);
                throw error;
            }
        });
    }
}
exports.soundcloudService = SoundCloudService.getInstance();
