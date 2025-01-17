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
exports.beatportService = void 0;
const axios_1 = __importDefault(require("axios"));
const BEATPORT_API_KEY = process.env.REACT_APP_BEATPORT_API_KEY;
class BeatportService {
    constructor() {
        this.baseUrl = 'https://api.beatport.com/v4';
        this.headers = {
            'Authorization': `Bearer ${BEATPORT_API_KEY}`,
            'Content-Type': 'application/json',
        };
    }
    static getInstance() {
        if (!BeatportService.instance) {
            BeatportService.instance = new BeatportService();
        }
        return BeatportService.instance;
    }
    getTrackByUPC(upc) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(`${this.baseUrl}/catalog/tracks/lookup`, {
                    headers: this.headers,
                    params: {
                        upc,
                    },
                });
                if (response.data.results.length) {
                    const track = response.data.results[0];
                    return {
                        title: track.name,
                        artist: track.artists[0].name,
                        imageUrl: track.release.image.uri,
                        releaseDate: track.publish_date,
                        beatportUrl: track.url,
                    };
                }
                throw new Error('Track not found on Beatport');
            }
            catch (error) {
                console.error('Error fetching track from Beatport:', error);
                throw error;
            }
        });
    }
}
exports.beatportService = BeatportService.getInstance();
