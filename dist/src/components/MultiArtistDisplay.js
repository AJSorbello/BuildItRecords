"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiArtistDisplay = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const ArtistCard_1 = require("./ArtistCard");
const MultiArtistDisplay = ({ artists, label = 'records' }) => {
    if (!artists || artists.length === 0) {
        return null;
    }
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { width: '100%', mt: 4 } }, { children: [artists.length > 1 && ((0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h6", sx: {
                    color: 'white',
                    mb: 2,
                    fontWeight: 'bold',
                    textAlign: 'center'
                } }, { children: "Featured Artists" }))), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 4, justifyContent: artists.length === 1 ? 'center' : 'flex-start' }, { children: artists.map((artist) => {
                    var _a;
                    return ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: artists.length === 1 ? 4 : 6, lg: artists.length === 1 ? 3 : 4 }, { children: (0, jsx_runtime_1.jsx)(ArtistCard_1.ArtistCard, { name: artist.name, imageUrl: ((_a = artist.images[0]) === null || _a === void 0 ? void 0 : _a.url) || '/default-artist-image.jpg', bio: artist.genres.join(', '), spotifyUrl: artist.external_urls.spotify, instagramUrl: artist.external_urls.instagram, soundcloudUrl: artist.external_urls.soundcloud, label: label }) }), artist.id));
                }) }))] })));
};
exports.MultiArtistDisplay = MultiArtistDisplay;
