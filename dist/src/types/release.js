"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRelease = exports.getArtistId = exports.getArtistName = void 0;
function getArtistName(artist) {
    return typeof artist === 'string' ? artist : artist.name;
}
exports.getArtistName = getArtistName;
function getArtistId(artist) {
    return typeof artist === 'string' ? undefined : artist.id;
}
exports.getArtistId = getArtistId;
function createRelease(data) {
    return {
        id: data.id || '',
        name: data.name || '',
        type: data.type,
        artists: data.artists || [],
        release_date: data.release_date,
        total_tracks: data.total_tracks,
        images: data.images || [],
        external_urls: data.external_urls || {},
        label: data.label,
        featured: data.featured || false,
        description: data.description || '',
        artwork_url: data.artwork_url || '',
        albumCover: data.albumCover || '',
        album: data.album || {},
        tracks: data.tracks || []
    };
}
exports.createRelease = createRelease;
