"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLabelModel = exports.isReleaseModel = exports.isTrackModel = exports.isArtistModel = void 0;
// Type Guards
function isArtistModel(obj) {
    return (obj &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.spotifyId === 'string');
}
exports.isArtistModel = isArtistModel;
function isTrackModel(obj) {
    return (obj &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.spotifyId === 'string' &&
        Array.isArray(obj.artistIds));
}
exports.isTrackModel = isTrackModel;
function isReleaseModel(obj) {
    return (obj &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.releaseDate === 'string' &&
        Array.isArray(obj.artistIds) &&
        Array.isArray(obj.trackIds));
}
exports.isReleaseModel = isReleaseModel;
function isLabelModel(obj) {
    return (obj &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        Array.isArray(obj.artistIds) &&
        Array.isArray(obj.trackIds) &&
        Array.isArray(obj.releaseIds));
}
exports.isLabelModel = isLabelModel;
