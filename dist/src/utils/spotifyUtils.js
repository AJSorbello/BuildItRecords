"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSpotifyUrl = exports.isValidSpotifyUrl = exports.extractSpotifyId = exports.transformSpotifyAlbum = exports.transformSpotifyArtist = exports.transformSpotifyTrack = void 0;
// Convert a Spotify track to our Track type
const transformSpotifyTrack = (track) => {
    var _a, _b, _c;
    return ({
        id: track.id,
        name: track.name,
        uri: track.uri,
        type: 'track',
        artists: track.artists.map(artist => ({
            id: artist.id,
            name: artist.name,
            uri: artist.uri,
            images: artist.images || [],
            external_urls: artist.external_urls,
            spotifyUrl: artist.external_urls.spotify
        })),
        album: {
            id: track.album.id,
            name: track.album.name,
            images: track.album.images,
            release_date: track.album.release_date,
            artists: track.album.artists.map(artist => ({
                id: artist.id,
                name: artist.name,
                uri: artist.uri,
                images: artist.images || [],
                external_urls: artist.external_urls,
                spotifyUrl: artist.external_urls.spotify
            }))
        },
        duration_ms: track.duration_ms,
        preview_url: track.preview_url,
        external_urls: track.external_urls,
        external_ids: track.external_ids,
        popularity: track.popularity,
        spotifyUrl: track.external_urls.spotify,
        releaseDate: track.album.release_date,
        artistImage: (_c = (_b = (_a = track.artists[0]) === null || _a === void 0 ? void 0 : _a.images) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.url
    });
};
exports.transformSpotifyTrack = transformSpotifyTrack;
// Convert a Spotify artist to our Artist type
const transformSpotifyArtist = (spotifyArtist) => ({
    id: spotifyArtist.id,
    name: spotifyArtist.name,
    uri: spotifyArtist.uri,
    images: spotifyArtist.images || [],
    external_urls: spotifyArtist.external_urls,
    spotifyUrl: spotifyArtist.external_urls.spotify
});
exports.transformSpotifyArtist = transformSpotifyArtist;
// Convert a Spotify album to our Album type
const transformSpotifyAlbum = (spotifyAlbum) => ({
    id: spotifyAlbum.id,
    name: spotifyAlbum.name,
    images: spotifyAlbum.images,
    release_date: spotifyAlbum.release_date,
    artists: spotifyAlbum.artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        uri: artist.uri,
        images: artist.images || [],
        external_urls: artist.external_urls,
        spotifyUrl: artist.external_urls.spotify
    })),
    album_type: spotifyAlbum.album_type,
    available_markets: spotifyAlbum.available_markets
});
exports.transformSpotifyAlbum = transformSpotifyAlbum;
// Extract Spotify ID from URL
const extractSpotifyId = (url) => {
    const match = url.match(/spotify\.com\/.+\/([a-zA-Z0-9]+)$/);
    return match ? match[1] : null;
};
exports.extractSpotifyId = extractSpotifyId;
// Check if URL is a valid Spotify URL
const isValidSpotifyUrl = (url) => {
    return /^https:\/\/open\.spotify\.com\/(track|album|artist)\/[a-zA-Z0-9]+$/.test(url);
};
exports.isValidSpotifyUrl = isValidSpotifyUrl;
// Normalize Spotify URL
const normalizeSpotifyUrl = (url) => {
    const id = (0, exports.extractSpotifyId)(url);
    if (!id)
        return url;
    return `https://open.spotify.com/track/${id}`;
};
exports.normalizeSpotifyUrl = normalizeSpotifyUrl;
