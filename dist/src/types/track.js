"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrackSpotifyUrl = exports.getTrackAlbumImage = exports.getTrackArtists = exports.getTrackDuration = exports.formatSpotifyTrack = exports.isTrack = void 0;
const isTrack = (item) => {
    return item && typeof item === 'object' && 'type' in item && item.type === 'track';
};
exports.isTrack = isTrack;
function formatSpotifyTrack(track) {
    var _a, _b;
    const formattedAlbum = {
        id: track.album.id,
        name: track.album.name,
        artists: track.album.artists,
        external_urls: Object.assign({}, track.album.external_urls),
        href: track.album.href,
        images: track.album.images,
        release_date: track.album.release_date,
        release_date_precision: track.album.release_date_precision,
        total_tracks: track.album.total_tracks,
        type: track.album.type,
        uri: track.album.uri,
        album_type: track.album.album_type
    };
    return {
        id: track.id,
        name: track.name,
        artists: track.artists,
        album: formattedAlbum,
        duration_ms: track.duration_ms,
        preview_url: track.preview_url,
        external_urls: Object.assign({}, track.external_urls),
        external_ids: Object.assign({}, track.external_ids),
        uri: track.uri,
        type: 'track',
        popularity: track.popularity,
        explicit: track.explicit,
        disc_number: track.disc_number,
        track_number: track.track_number,
        available_markets: track.available_markets,
        isrc: (_a = track.external_ids) === null || _a === void 0 ? void 0 : _a.isrc,
        spotifyUrl: (_b = track.external_urls) === null || _b === void 0 ? void 0 : _b.spotify
    };
}
exports.formatSpotifyTrack = formatSpotifyTrack;
function getTrackDuration(track) {
    const minutes = Math.floor(track.duration_ms / 60000);
    const seconds = Math.floor((track.duration_ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
exports.getTrackDuration = getTrackDuration;
function getTrackArtists(track) {
    return track.artists.map(artist => artist.name).join(', ');
}
exports.getTrackArtists = getTrackArtists;
function getTrackAlbumImage(track) {
    var _a, _b, _c;
    return ((_c = (_b = (_a = track.album) === null || _a === void 0 ? void 0 : _a.images) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.url) || '';
}
exports.getTrackAlbumImage = getTrackAlbumImage;
function getTrackSpotifyUrl(track) {
    var _a;
    return ((_a = track.external_urls) === null || _a === void 0 ? void 0 : _a.spotify) || '';
}
exports.getTrackSpotifyUrl = getTrackSpotifyUrl;
