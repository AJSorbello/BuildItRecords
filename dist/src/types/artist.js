"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArtistFollowers = exports.getArtistGenres = exports.getArtistImage = exports.formatSpotifyArtist = void 0;
function formatSpotifyArtist(artist) {
    return {
        id: artist.id,
        name: artist.name,
        external_urls: artist.external_urls,
        followers: artist.followers,
        genres: artist.genres,
        href: artist.href,
        images: artist.images,
        popularity: artist.popularity,
        type: 'artist',
        uri: artist.uri
    };
}
exports.formatSpotifyArtist = formatSpotifyArtist;
function getArtistImage(artist) {
    var _a, _b;
    return ((_b = (_a = artist.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || '';
}
exports.getArtistImage = getArtistImage;
function getArtistGenres(artist) {
    return artist.genres || [];
}
exports.getArtistGenres = getArtistGenres;
function getArtistFollowers(artist) {
    var _a;
    return ((_a = artist.followers) === null || _a === void 0 ? void 0 : _a.total) || 0;
}
exports.getArtistFollowers = getArtistFollowers;
