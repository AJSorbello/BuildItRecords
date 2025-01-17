"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtistProfile = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const useSpotifyArtist_1 = require("../hooks/useSpotifyArtist");
const ReleaseCard_1 = require("./ReleaseCard");
const ArtistProfile = ({ artistId }) => {
    var _a;
    const { artist, loading, error } = (0, useSpotifyArtist_1.useSpotifyArtist)(artistId, {
        includeRelated: true,
    });
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ display: "flex", justifyContent: "center", p: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) })));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ p: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "error" }, { children: error })) })));
    }
    if (!artist)
        return null;
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Paper, Object.assign({ elevation: 3, sx: { p: 3, mb: 4 } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ container: true, spacing: 4 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, md: 4 }, { children: ((_a = artist.images) === null || _a === void 0 ? void 0 : _a[0]) && ((0, jsx_runtime_1.jsx)(material_1.Avatar, { src: artist.images[0].url, alt: artist.name, sx: { width: '100%', height: 'auto', aspectRatio: '1', mb: 2 }, variant: "rounded" })) })), (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ item: true, xs: 12, md: 8 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h3", gutterBottom: true }, { children: artist.name })), (0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "subtitle1", color: "text.secondary", gutterBottom: true }, { children: [artist.followers.total.toLocaleString(), " followers"] })), (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { my: 2 } }, { children: artist.genres.map((genre) => ((0, jsx_runtime_1.jsx)(material_1.Chip, { label: genre, sx: { mr: 1, mb: 1 }, size: "small" }, genre))) })), (0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body1", gutterBottom: true }, { children: ["Popularity: ", artist.popularity, "/100"] }))] }))] })) })), artist.topTracks && artist.topTracks.length > 0 && ((0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ mb: 6 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true }, { children: "Top Tracks" })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: artist.topTracks.slice(0, 6).map((track) => ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4 }, { children: (0, jsx_runtime_1.jsx)(ReleaseCard_1.ReleaseCard, { track: track }) }), track.id))) }))] }))), artist.albums && artist.albums.length > 0 && ((0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ mb: 6 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true }, { children: "Albums" })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: artist.albums.map((album) => {
                            var _a, _b;
                            return ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4 }, { children: (0, jsx_runtime_1.jsx)(ReleaseCard_1.ReleaseCard, { release: {
                                        id: album.id,
                                        title: album.name,
                                        type: album.type,
                                        artist: artist.name,
                                        artwork: (_b = (_a = album.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url,
                                        spotifyUrl: album.spotifyUrl,
                                    } }) }), album.id));
                        }) }))] }))), artist.relatedArtists && artist.relatedArtists.length > 0 && ((0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true }, { children: "Related Artists" })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: artist.relatedArtists.slice(0, 6).map((relatedArtist) => {
                            var _a, _b;
                            return ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4 }, { children: (0, jsx_runtime_1.jsx)(ReleaseCard_1.ReleaseCard, { release: {
                                        id: relatedArtist.id,
                                        title: relatedArtist.name,
                                        type: 'artist',
                                        artist: relatedArtist.name,
                                        artwork: (_b = (_a = relatedArtist.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url,
                                        spotifyUrl: relatedArtist.spotifyUrl,
                                    } }) }), relatedArtist.id));
                        }) }))] }))] }));
};
exports.ArtistProfile = ArtistProfile;
