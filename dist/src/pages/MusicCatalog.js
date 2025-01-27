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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicCatalog = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const material_1 = require("@mui/material");
const useSpotifySearch_1 = require("../hooks/useSpotifySearch");
const ArtistProfile_1 = require("../components/ArtistProfile");
const TrackList_1 = require("../components/TrackList");
const TrackDetails_1 = require("../components/TrackDetails");
function TabPanel(props) {
    const { children, value, index } = props, other = __rest(props, ["children", "value", "index"]);
    return ((0, jsx_runtime_1.jsx)("div", Object.assign({ role: "tabpanel", hidden: value !== index, id: `simple-tabpanel-${index}`, "aria-labelledby": `simple-tab-${index}` }, other, { children: value === index && (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { p: 3 } }, { children: children })) })));
}
const MusicCatalog = () => {
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [selectedTab, setSelectedTab] = (0, react_1.useState)(0);
    const [selectedTrack, setSelectedTrack] = (0, react_1.useState)(null);
    const { tracks, artists, loading, error } = (0, useSpotifySearch_1.useSpotifySearch)(searchQuery, ['track', 'artist'], { limit: 20 });
    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };
    const handleTrackClick = (track) => {
        setSelectedTrack(track);
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Container, Object.assign({ maxWidth: "lg", sx: { py: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", gutterBottom: true }, { children: "Music Catalog" })), (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Search for tracks or artists", variant: "outlined", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), sx: { mb: 4 } }), error && ((0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "error", sx: { mb: 2 } }, { children: error }))), (0, jsx_runtime_1.jsxs)(material_1.Paper, Object.assign({ sx: { width: '100%', mb: 4 } }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Tabs, Object.assign({ value: selectedTab, onChange: handleTabChange, "aria-label": "music catalog tabs" }, { children: [(0, jsx_runtime_1.jsx)(material_1.Tab, { label: `Tracks (${tracks.length})` }), (0, jsx_runtime_1.jsx)(material_1.Tab, { label: `Artists (${artists.length})` })] })), (0, jsx_runtime_1.jsx)(TabPanel, Object.assign({ value: selectedTab, index: 0 }, { children: (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ container: true, spacing: 4 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, md: selectedTrack ? 6 : 12 }, { children: (0, jsx_runtime_1.jsx)(TrackList_1.TrackList, { tracks: tracks, loading: loading, onTrackClick: handleTrackClick }) })), selectedTrack && ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, md: 6 }, { children: (0, jsx_runtime_1.jsx)(TrackDetails_1.TrackDetails, { track: selectedTrack }) })))] })) })), (0, jsx_runtime_1.jsx)(TabPanel, Object.assign({ value: selectedTab, index: 1 }, { children: (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 4 }, { children: artists.map((artist) => ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(ArtistProfile_1.ArtistProfile, { artistId: artist.id }) }), artist.id))) })) }))] }))] })));
};
exports.MusicCatalog = MusicCatalog;
