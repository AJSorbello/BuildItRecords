"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const material_1 = require("@mui/material");
const ArtistCard = ({ artist, onClick }) => {
    var _a, _b;
    const [imageLoading, setImageLoading] = react_1.default.useState(true);
    // Get image URL from either profile_image or images array
    const getImageUrl = () => {
        if (artist.profile_image) {
            return artist.profile_image;
        }
        if (artist.images && artist.images.length > 0) {
            const sortedImages = [...artist.images].sort((a, b) => {
                const aSize = (a.width || 0) * (a.height || 0);
                const bSize = (b.width || 0) * (b.height || 0);
                return bSize - aSize;
            });
            return sortedImages[0].url;
        }
        return '';
    };
    const imageUrl = getImageUrl();
    const handleImageLoad = () => {
        setImageLoading(false);
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Card, Object.assign({ onClick: onClick, sx: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            cursor: onClick ? 'pointer' : 'default',
            '&:hover': onClick ? {
                transform: 'scale(1.02)',
                transition: 'transform 0.2s ease-in-out'
            } : {}
        } }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { position: 'relative', paddingTop: '100%' } }, { children: [imageLoading && ((0, jsx_runtime_1.jsx)(material_1.Skeleton, { variant: "rectangular", sx: {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%'
                        } })), imageUrl && ((0, jsx_runtime_1.jsx)(material_1.CardMedia, { component: "img", image: imageUrl, alt: artist.name, onLoad: handleImageLoad, sx: {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: imageLoading ? 'none' : 'block'
                        } }))] })), (0, jsx_runtime_1.jsxs)(material_1.CardContent, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h6", noWrap: true }, { children: artist.name })), artist.followers && ((0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary" }, { children: [artist.followers.total.toLocaleString(), " followers"] }))), (artist.spotify_url || ((_a = artist.external_urls) === null || _a === void 0 ? void 0 : _a.spotify)) && ((0, jsx_runtime_1.jsx)(material_1.Link, Object.assign({ href: artist.spotify_url || ((_b = artist.external_urls) === null || _b === void 0 ? void 0 : _b.spotify), target: "_blank", rel: "noopener noreferrer", onClick: (e) => e.stopPropagation(), sx: {
                            color: 'primary.main',
                            textDecoration: 'none',
                            '&:hover': {
                                textDecoration: 'underline'
                            }
                        } }, { children: "Open in Spotify" })))] })] })));
};
exports.default = ArtistCard;
