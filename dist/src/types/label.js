"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLabelAlbums = exports.getLabelTracks = exports.getLabelArtists = exports.getLabelImage = exports.formatLabel = void 0;
function formatLabel(label) {
    return {
        id: label.id,
        name: label.name,
        displayName: label.displayName || label.name,
        description: label.description,
        website: label.website,
        imageUrl: label.imageUrl,
        artists: label.artists || [],
        tracks: label.tracks || [],
        albums: label.albums || [],
        createdAt: label.createdAt,
        updatedAt: label.updatedAt
    };
}
exports.formatLabel = formatLabel;
function getLabelImage(label) {
    return label.imageUrl || '';
}
exports.getLabelImage = getLabelImage;
function getLabelArtists(label) {
    return label.artists || [];
}
exports.getLabelArtists = getLabelArtists;
function getLabelTracks(label) {
    return label.tracks || [];
}
exports.getLabelTracks = getLabelTracks;
function getLabelAlbums(label) {
    return label.albums || [];
}
exports.getLabelAlbums = getLabelAlbums;
