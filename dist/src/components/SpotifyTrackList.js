"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const react_1 = __importStar(require("react"));
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const SpotifyClient_1 = __importDefault(require("../services/SpotifyClient"));
const SpotifyTrackList = ({ searchQuery }) => {
    const [tracks, setTracks] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [playingTrack, setPlayingTrack] = (0, react_1.useState)(null);
    const [audio, setAudio] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const fetchTracks = () => __awaiter(void 0, void 0, void 0, function* () {
            if (!searchQuery)
                return;
            setLoading(true);
            try {
                const results = yield SpotifyClient_1.default.searchTracks(searchQuery);
                setTracks(results);
            }
            catch (error) {
                console.error('Error fetching tracks:', error);
            }
            finally {
                setLoading(false);
            }
        });
        fetchTracks();
    }, [searchQuery]);
    const handlePlayPause = (track) => {
        if ((playingTrack === null || playingTrack === void 0 ? void 0 : playingTrack.id) === track.id) {
            audio === null || audio === void 0 ? void 0 : audio.pause();
            setPlayingTrack(null);
            setAudio(null);
        }
        else {
            if (audio) {
                audio.pause();
            }
            const newAudio = new Audio(track.preview_url);
            newAudio.play();
            setPlayingTrack(track);
            setAudio(newAudio);
        }
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ display: "flex", justifyContent: "center", p: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) })));
    }
    return ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 2 }, { children: tracks.map((track) => {
            var _a;
            return ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4 }, { children: (0, jsx_runtime_1.jsxs)(material_1.Card, Object.assign({ sx: { display: 'flex', height: '100%' } }, { children: [(0, jsx_runtime_1.jsx)(material_1.CardMedia, { component: "img", sx: { width: 151 }, image: (_a = track.album.images[0]) === null || _a === void 0 ? void 0 : _a.url, alt: track.album.name }), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { display: 'flex', flexDirection: 'column', width: '100%' } }, { children: [(0, jsx_runtime_1.jsxs)(material_1.CardContent, Object.assign({ sx: { flex: '1 0 auto' } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ component: "div", variant: "h6", noWrap: true }, { children: track.name })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "subtitle1", color: "text.secondary", component: "div", noWrap: true }, { children: track.artists.map(artist => artist.name).join(', ') }))] })), (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { display: 'flex', alignItems: 'center', pl: 1, pb: 1 } }, { children: track.preview_url && ((0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ onClick: () => handlePlayPause(track) }, { children: (playingTrack === null || playingTrack === void 0 ? void 0 : playingTrack.id) === track.id ? (0, jsx_runtime_1.jsx)(icons_material_1.Pause, {}) : (0, jsx_runtime_1.jsx)(icons_material_1.PlayArrow, {}) }))) }))] }))] })) }), track.id));
        }) })));
};
exports.default = SpotifyTrackList;
