"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackDetails = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const trackUtils_1 = require("../utils/trackUtils");
const TrackDetails = ({ track, loading, error, }) => {
    var _a, _b, _c, _d, _e;
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ display: "flex", justifyContent: "center", p: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) })));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ p: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "error" }, { children: error })) })));
    }
    if (!track)
        return null;
    return ((0, jsx_runtime_1.jsx)(material_1.Paper, Object.assign({ elevation: 3, sx: { p: 3 } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, md: 4 }, { children: ((_b = (_a = track.album) === null || _a === void 0 ? void 0 : _a.images) === null || _b === void 0 ? void 0 : _b[0]) && ((0, jsx_runtime_1.jsx)(material_1.Box, { component: "img", src: track.album.images[0].url, alt: track.name, sx: {
                            width: '100%',
                            height: 'auto',
                            borderRadius: 1,
                        } })) })), (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ item: true, xs: 12, md: 8 }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ display: "flex", justifyContent: "space-between", alignItems: "center" }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", gutterBottom: true }, { children: track.name })), ((_c = track.external_urls) === null || _c === void 0 ? void 0 : _c.spotify) && ((0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ component: material_1.Link, href: track.external_urls.spotify, target: "_blank", rel: "noopener noreferrer", size: "large", color: "primary" }, { children: (0, jsx_runtime_1.jsx)(icons_material_1.PlayArrow, {}) })))] })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h6", color: "text.secondary", gutterBottom: true }, { children: track.artists.map(artist => artist.name).join(', ') })), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ mt: 2 }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body1", gutterBottom: true }, { children: ["Album: ", (_d = track.album) === null || _d === void 0 ? void 0 : _d.name] })), (0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body1", gutterBottom: true }, { children: ["Duration: ", (0, trackUtils_1.formatDuration)(track.duration_ms)] })), ((_e = track.album) === null || _e === void 0 ? void 0 : _e.release_date) && ((0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body1", gutterBottom: true }, { children: ["Release Date: ", new Date(track.album.release_date).toLocaleDateString()] }))), (0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "body1", gutterBottom: true }, { children: ["Track Number: ", track.track_number] })), track.explicit && ((0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body1", color: "error", gutterBottom: true }, { children: "Explicit" })))] })), track.preview_url && ((0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ mt: 3 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "subtitle1", gutterBottom: true }, { children: "Preview" })), (0, jsx_runtime_1.jsx)("audio", Object.assign({ controls: true, src: track.preview_url }, { children: "Your browser does not support the audio element." }))] })))] }))] })) })));
};
exports.TrackDetails = TrackDetails;
