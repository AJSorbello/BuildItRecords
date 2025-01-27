"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const material_1 = require("@mui/material");
const Refresh_1 = __importDefault(require("@mui/icons-material/Refresh"));
const PageLayout_1 = __importDefault(require("../../components/PageLayout"));
const useReleases_1 = require("../../hooks/useReleases");
const RecordsHome = ({ labelId: propLabelId }) => {
    const [mainTrack, setMainTrack] = (0, react_1.useState)(null);
    const [otherVersions, setOtherVersions] = (0, react_1.useState)([]);
    const { releases, loading, error, retryFetch, canRetry } = (0, useReleases_1.useReleases)({ label: 'records' });
    (0, react_1.useEffect)(() => {
        const fetchFeaturedTracks = () => __awaiter(void 0, void 0, void 0, function* () {
            if (!releases || releases.length === 0)
                return;
            // Sort releases by date (newest first)
            const sortedReleases = [...releases].sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
            // Convert Album to Release type
            const convertToRelease = (album) => {
                var _a, _b, _c, _d;
                return (Object.assign(Object.assign({}, album), { title: album.name, releaseDate: album.release_date, artworkUrl: (_a = album.images[0]) === null || _a === void 0 ? void 0 : _a.url, artist: {
                        name: ((_b = album.artists[0]) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown Artist',
                        imageUrl: (_c = album.images[0]) === null || _c === void 0 ? void 0 : _c.url,
                        spotifyUrl: (_d = album.external_urls) === null || _d === void 0 ? void 0 : _d.spotify
                    } }));
            };
            // Set main track and other versions
            if (sortedReleases.length > 0) {
                setMainTrack(convertToRelease(sortedReleases[0]));
                setOtherVersions(sortedReleases.slice(1).map(convertToRelease));
            }
        });
        fetchFeaturedTracks();
    }, [releases]);
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, { children: "Loading releases..." }) })));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }, { children: (0, jsx_runtime_1.jsx)(material_1.Alert, Object.assign({ severity: "error", action: canRetry && ((0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ color: "inherit", size: "small", onClick: retryFetch, startIcon: (0, jsx_runtime_1.jsx)(Refresh_1.default, {}) }, { children: "Retry" }))) }, { children: error })) })));
    }
    return ((0, jsx_runtime_1.jsx)(PageLayout_1.default, Object.assign({ label: "records" }, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { py: 4, px: { xs: 2, sm: 3 } } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", component: "h1", gutterBottom: true }, { children: "Build It Records" })), mainTrack && ((0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { mb: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true }, { children: "Latest Release" })), (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.Box, { component: "img", src: mainTrack.artworkUrl || '/placeholder.jpg', alt: mainTrack.title, sx: {
                                            width: '100%',
                                            height: 'auto',
                                            borderRadius: 1,
                                        } }) })), (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 8 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h6" }, { children: mainTrack.title })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "subtitle1", color: "text.secondary" }, { children: mainTrack.artist.name })), (0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary" }, { children: ["Released: ", new Date(mainTrack.releaseDate).toLocaleDateString()] }))] }))] }))] }))), otherVersions.length > 0 && ((0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true }, { children: "Other Versions" })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: otherVersions.map((release) => ((0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Box, { component: "img", src: release.artworkUrl || '/placeholder.jpg', alt: release.title, sx: {
                                            width: '100%',
                                            height: 'auto',
                                            borderRadius: 1,
                                        } }), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "subtitle1" }, { children: release.title })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary" }, { children: release.artist.name }))] }), release.id))) }))] }))] })) })));
};
exports.default = RecordsHome;
