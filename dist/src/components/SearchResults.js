"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchResults = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const material_1 = require("@mui/material");
const ReleaseCard_1 = require("./ReleaseCard");
const useSpotifySearch_1 = require("../hooks/useSpotifySearch");
function TabPanel(props) {
    const { children, value, index } = props, other = __rest(props, ["children", "value", "index"]);
    return ((0, jsx_runtime_1.jsx)("div", Object.assign({ role: "tabpanel", hidden: value !== index, id: `search-tabpanel-${index}`, "aria-labelledby": `search-tab-${index}` }, other, { children: value === index && (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { p: 3 } }, { children: children })) })));
}
const SearchResults = ({ query, onSelect, }) => {
    const [tabValue, setTabValue] = react_1.default.useState(0);
    const { tracks, artists, albums, loading, error } = (0, useSpotifySearch_1.useSpotifySearch)(query, ['track', 'artist', 'album'], { limit: 20 });
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ display: "flex", justifyContent: "center", p: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) })));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ p: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "error" }, { children: error })) })));
    }
    if (!query) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ p: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "textSecondary" }, { children: "Enter a search term to find music" })) })));
    }
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { width: '100%' } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { borderBottom: 1, borderColor: 'divider' } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Tabs, Object.assign({ value: tabValue, onChange: handleTabChange, "aria-label": "search results tabs" }, { children: [(0, jsx_runtime_1.jsx)(material_1.Tab, { label: `Tracks (${tracks.length})` }), (0, jsx_runtime_1.jsx)(material_1.Tab, { label: `Artists (${artists.length})` }), (0, jsx_runtime_1.jsx)(material_1.Tab, { label: `Albums (${albums.length})` })] })) })), (0, jsx_runtime_1.jsx)(TabPanel, Object.assign({ value: tabValue, index: 0 }, { children: (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: tracks.map((track) => ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4 }, { children: (0, jsx_runtime_1.jsx)(ReleaseCard_1.ReleaseCard, { track: track, onClick: () => onSelect === null || onSelect === void 0 ? void 0 : onSelect(track) }) }), track.id))) })) })), (0, jsx_runtime_1.jsx)(TabPanel, Object.assign({ value: tabValue, index: 1 }, { children: (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: artists.map((artist) => {
                        var _a, _b;
                        return ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4 }, { children: (0, jsx_runtime_1.jsx)(ReleaseCard_1.ReleaseCard, { release: {
                                    id: artist.id,
                                    title: artist.name,
                                    type: 'artist',
                                    artist: artist.name,
                                    artwork: (_b = (_a = artist.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url,
                                    spotifyUrl: artist.spotifyUrl,
                                }, onClick: () => onSelect === null || onSelect === void 0 ? void 0 : onSelect(artist) }) }), artist.id));
                    }) })) })), (0, jsx_runtime_1.jsx)(TabPanel, Object.assign({ value: tabValue, index: 2 }, { children: (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: albums.map((album) => {
                        var _a, _b, _c;
                        return ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4 }, { children: (0, jsx_runtime_1.jsx)(ReleaseCard_1.ReleaseCard, { release: {
                                    id: album.id,
                                    title: album.name,
                                    type: album.type,
                                    artist: ((_a = album.artists[0]) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown Artist',
                                    artwork: (_c = (_b = album.images) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.url,
                                    spotifyUrl: album.spotifyUrl,
                                }, onClick: () => onSelect === null || onSelect === void 0 ? void 0 : onSelect(album) }) }), album.id));
                    }) })) }))] })));
};
exports.SearchResults = SearchResults;
