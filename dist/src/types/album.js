"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAlbumArtists = exports.getAlbumYear = exports.getAlbumImage = exports.formatSpotifyAlbum = void 0;
function formatSpotifyAlbum(album) {
    var _a;
    return {
        id: album.id,
        name: album.name,
        artists: album.artists,
        external_urls: album.external_urls,
        href: album.href,
        images: album.images,
        release_date: album.release_date,
        release_date_precision: album.release_date_precision,
        total_tracks: album.total_tracks,
        type: album.type,
        uri: album.uri,
        album_type: album.album_type,
        tracks: (_a = album.tracks) === null || _a === void 0 ? void 0 : _a.items
    };
}
exports.formatSpotifyAlbum = formatSpotifyAlbum;
function getAlbumImage(album) {
    var _a, _b;
    return ((_b = (_a = album.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || '';
}
exports.getAlbumImage = getAlbumImage;
function getAlbumYear(album) {
    var _a;
    return ((_a = album.release_date) === null || _a === void 0 ? void 0 : _a.split('-')[0]) || '';
}
exports.getAlbumYear = getAlbumYear;
function getAlbumArtists(album) {
    return album.artists.map(artist => artist.name).join(', ');
}
exports.getAlbumArtists = getAlbumArtists;
