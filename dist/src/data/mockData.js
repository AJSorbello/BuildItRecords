"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeMockData = exports.mockTracks = exports.mockArtists = void 0;
exports.mockArtists = [];
exports.mockTracks = [];
const initializeMockData = () => {
    // Initialize tracks if they don't exist
    const existingTracks = localStorage.getItem('tracks');
    if (!existingTracks) {
        localStorage.setItem('tracks', JSON.stringify([]));
    }
    // Initialize artists if they don't exist
    const existingArtists = localStorage.getItem('artists');
    if (!existingArtists) {
        localStorage.setItem('artists', JSON.stringify([]));
    }
};
exports.initializeMockData = initializeMockData;
