"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getData = exports.resetData = exports.clearData = exports.initializeData = void 0;
const mockData_1 = require("../data/mockData");
const initializeData = () => {
    // Initialize tracks if they don't exist
    if (!localStorage.getItem('tracks')) {
        localStorage.setItem('tracks', JSON.stringify(mockData_1.mockTracks));
    }
    // Initialize artists if they don't exist
    if (!localStorage.getItem('artists')) {
        localStorage.setItem('artists', JSON.stringify(mockData_1.mockArtists));
    }
};
exports.initializeData = initializeData;
const clearData = () => {
    localStorage.removeItem('tracks');
    localStorage.removeItem('artists');
};
exports.clearData = clearData;
const resetData = () => {
    localStorage.setItem('tracks', JSON.stringify(mockData_1.mockTracks));
    localStorage.setItem('artists', JSON.stringify(mockData_1.mockArtists));
};
exports.resetData = resetData;
const getData = () => {
    try {
        const tracks = localStorage.getItem('tracks');
        const artists = localStorage.getItem('artists');
        return {
            tracks: tracks ? JSON.parse(tracks) : [],
            artists: artists ? JSON.parse(artists) : []
        };
    }
    catch (error) {
        console.error('Error getting data:', error);
        return { tracks: [], artists: [] };
    }
};
exports.getData = getData;
