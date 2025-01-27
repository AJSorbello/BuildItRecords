"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertSpotifyTrack = exports.convertSpotifyAlbum = exports.convertSpotifyArtist = exports.isRelease = exports.isTrack = exports.isArtist = exports.isSpotifyAlbum = exports.isSpotifyTrack = exports.isSpotifyArtist = void 0;
// Type Guards
const isSpotifyArtist = (obj) => {
    return obj &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.uri === 'string' &&
        obj.type === 'artist';
};
exports.isSpotifyArtist = isSpotifyArtist;
const isSpotifyTrack = (obj) => {
    return obj &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.duration_ms === 'number' &&
        obj.type === 'track' &&
        Array.isArray(obj.artists) &&
        obj.artists.every(exports.isSpotifyArtist);
};
exports.isSpotifyTrack = isSpotifyTrack;
const isSpotifyAlbum = (obj) => {
    return obj &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.release_date === 'string' &&
        obj.type === 'album' &&
        Array.isArray(obj.artists) &&
        obj.artists.every(exports.isSpotifyArtist);
};
exports.isSpotifyAlbum = isSpotifyAlbum;
const isArtist = (obj) => {
    var _a;
    return obj &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.uri === 'string' &&
        typeof ((_a = obj.external_urls) === null || _a === void 0 ? void 0 : _a.spotify) === 'string' &&
        typeof obj.spotify_url === 'string' &&
        obj.type === 'artist';
};
exports.isArtist = isArtist;
const isTrack = (obj) => {
    return obj &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        Array.isArray(obj.artists) &&
        obj.artists.every(exports.isArtist) &&
        obj.type === 'track';
};
exports.isTrack = isTrack;
const isRelease = (obj) => {
    return obj &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        Array.isArray(obj.artists) &&
        obj.artists.every(exports.isArtist) &&
        Array.isArray(obj.tracks) &&
        obj.tracks.every(exports.isTrack) &&
        obj.type === 'release';
};
exports.isRelease = isRelease;
// Type conversion utilities
const convertSpotifyArtist = (artist) => {
    var _a, _b;
    return ({
        id: artist.id,
        name: artist.name,
        uri: artist.uri,
        external_urls: artist.external_urls,
        spotify_url: artist.external_urls.spotify,
        image_url: (_b = (_a = artist.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url,
        type: 'artist'
    });
};
exports.convertSpotifyArtist = convertSpotifyArtist;
const convertSpotifyAlbum = (album) => ({
    id: album.id,
    name: album.name,
    artists: album.artists.map(exports.convertSpotifyArtist),
    images: album.images,
    release_date: album.release_date,
    release_date_precision: album.release_date_precision,
    total_tracks: album.total_tracks,
    external_urls: album.external_urls,
    uri: album.uri,
    type: 'album',
    spotifyUrl: album.external_urls.spotify
});
exports.convertSpotifyAlbum = convertSpotifyAlbum;
const convertSpotifyTrack = (track) => ({
    id: track.id,
    name: track.name,
    artists: track.artists.map(exports.convertSpotifyArtist),
    duration_ms: track.duration_ms,
    preview_url: track.preview_url,
    external_urls: track.external_urls,
    external_ids: track.external_ids,
    uri: track.uri,
    album: track.album ? (0, exports.convertSpotifyAlbum)(track.album) : undefined,
    popularity: track.popularity,
    spotifyUrl: track.external_urls.spotify,
    type: 'track'
});
exports.convertSpotifyTrack = convertSpotifyTrack;
