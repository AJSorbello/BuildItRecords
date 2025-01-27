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
const spotify_1 = require("../spotify");
const globals_1 = require("@jest/globals");
(0, globals_1.describe)('SpotifyService', () => {
    // This is a real ISRC for "Bohemian Rhapsody" by Queen
    const TEST_ISRC = 'GBUM71029604';
    (0, globals_1.it)('should fetch track by ISRC', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const track = yield spotify_1.spotifyService.getTrackByISRC(TEST_ISRC);
            (0, globals_1.expect)(track).toBeDefined();
            (0, globals_1.expect)(track.title).toBeDefined();
            (0, globals_1.expect)(track.artist).toBeDefined();
            (0, globals_1.expect)(track.imageUrl).toBeDefined();
            (0, globals_1.expect)(track.releaseDate).toBeDefined();
            (0, globals_1.expect)(track.spotifyUrl).toBeDefined();
            // Log the result for manual verification
            console.log('Found track:', track);
        }
        catch (error) {
            fail('Failed to fetch track: ' + error);
        }
    }));
});
