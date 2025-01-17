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
exports.searchTracks = exports.getTrackImports = exports.deleteTrack = exports.updateTrack = exports.getTracks = void 0;
const config_1 = require("../config");
// Get tracks by label
const getTracks = (token, labelId) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(`${config_1.API_URL}/tracks/${labelId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch tracks');
    }
    return response.json();
});
exports.getTracks = getTracks;
// Update track
const updateTrack = (token, trackId, updates) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(`${config_1.API_URL}/tracks/${trackId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
    });
    if (!response.ok) {
        throw new Error('Failed to update track');
    }
    return response.json();
});
exports.updateTrack = updateTrack;
// Delete track
const deleteTrack = (token, trackId) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(`${config_1.API_URL}/tracks/${trackId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        throw new Error('Failed to delete track');
    }
});
exports.deleteTrack = deleteTrack;
// Get track import history
const getTrackImports = (token, trackId) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(`${config_1.API_URL}/tracks/${trackId}/imports`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch track import history');
    }
    return response.json();
});
exports.getTrackImports = getTrackImports;
// Search tracks
const searchTracks = (token, query, limit = 20) => __awaiter(void 0, void 0, void 0, function* () {
    const params = new URLSearchParams({
        q: query,
        limit: limit.toString()
    });
    const response = yield fetch(`${config_1.API_URL}/tracks/search?${params}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        throw new Error('Failed to search tracks');
    }
    return response.json();
});
exports.searchTracks = searchTracks;
