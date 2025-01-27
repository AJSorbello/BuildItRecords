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
const react_1 = __importDefault(require("react"));
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const DatabaseService_1 = require("../../services/DatabaseService");
const TrackManager = ({ labelId, tracks = [], onEdit, onDelete }) => {
    const [playingTrackId, setPlayingTrackId] = react_1.default.useState(null);
    const audioRef = react_1.default.useRef(null);
    const [searchQuery, setSearchQuery] = react_1.default.useState('');
    const [loading, setLoading] = react_1.default.useState(false);
    const [error, setError] = react_1.default.useState(null);
    const formatDuration = (ms) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };
    const handlePlayPause = (track) => {
        var _a;
        if (!(track === null || track === void 0 ? void 0 : track.preview_url))
            return;
        if (playingTrackId === track.id) {
            (_a = audioRef.current) === null || _a === void 0 ? void 0 : _a.pause();
            setPlayingTrackId(null);
        }
        else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            audioRef.current = new Audio(track.preview_url);
            audioRef.current.play();
            setPlayingTrackId(track.id);
        }
    };
    const handleSearch = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!labelId)
            return;
        try {
            setLoading(true);
            setError(null);
            const results = yield DatabaseService_1.databaseService.getTracks(labelId);
            if (onEdit)
                yield onEdit();
        }
        catch (err) {
            console.error('Error searching tracks:', err);
            setError(err instanceof Error ? err.message : 'Failed to search tracks');
        }
        finally {
            setLoading(false);
        }
    });
    return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { p: 3 } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { display: 'flex', gap: 2, mb: 3 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, variant: "outlined", placeholder: "Search tracks...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), onKeyPress: (e) => e.key === 'Enter' && handleSearch(), InputProps: {
                                    endAdornment: (0, jsx_runtime_1.jsx)(icons_material_1.Search, {})
                                } }), (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ variant: "contained", onClick: handleSearch, disabled: loading }, { children: "Search" }))] })) })), (0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: [loading && ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { display: 'flex', justifyContent: 'center', p: 3 } }, { children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) }))), error && ((0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "error", sx: { mb: 2 } }, { children: error }))), !loading && tracks && tracks.length > 0 && ((0, jsx_runtime_1.jsx)(material_1.TableContainer, Object.assign({ component: material_1.Paper }, { children: (0, jsx_runtime_1.jsxs)(material_1.Table, Object.assign({ sx: { minWidth: 650 }, "aria-label": "tracks table" }, { children: [(0, jsx_runtime_1.jsx)(material_1.TableHead, { children: (0, jsx_runtime_1.jsxs)(material_1.TableRow, { children: [(0, jsx_runtime_1.jsx)(material_1.TableCell, { children: "Album" }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: "Track" }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: "Artist" }), (0, jsx_runtime_1.jsx)(material_1.TableCell, Object.assign({ align: "right" }, { children: "Duration" })), (0, jsx_runtime_1.jsx)(material_1.TableCell, Object.assign({ align: "right" }, { children: "Preview" }))] }) }), (0, jsx_runtime_1.jsx)(material_1.TableBody, { children: tracks.map((track) => {
                                            var _a, _b, _c, _d, _e, _f;
                                            return track && ((0, jsx_runtime_1.jsxs)(material_1.TableRow, Object.assign({ sx: { '&:last-child td, &:last-child th': { border: 0 } } }, { children: [(0, jsx_runtime_1.jsx)(material_1.TableCell, { children: (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { display: 'flex', alignItems: 'center' } }, { children: (0, jsx_runtime_1.jsx)(material_1.Avatar, { variant: "rounded", src: (_c = (_b = (_a = track.album) === null || _a === void 0 ? void 0 : _a.images) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.url, alt: ((_d = track.album) === null || _d === void 0 ? void 0 : _d.name) || '', sx: { width: 56, height: 56, marginRight: 2 } }) })) }), (0, jsx_runtime_1.jsxs)(material_1.TableCell, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body1", component: "div" }, { children: track.name })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body2", color: "text.secondary" }, { children: (_e = track.album) === null || _e === void 0 ? void 0 : _e.name }))] }), (0, jsx_runtime_1.jsx)(material_1.TableCell, { children: (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { display: 'flex', alignItems: 'center' } }, { children: (_f = track.artists) === null || _f === void 0 ? void 0 : _f.map((artist, index) => {
                                                                var _a, _b, _c;
                                                                return artist && ((0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: {
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        marginRight: 1
                                                                    } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { src: (_b = (_a = artist.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url, alt: artist.name, sx: { width: 32, height: 32, marginRight: 1 } }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { children: [artist.name, index < (((_c = track.artists) === null || _c === void 0 ? void 0 : _c.length) || 0) - 1 ? ', ' : ''] })] }), artist.id));
                                                            }) })) }), (0, jsx_runtime_1.jsx)(material_1.TableCell, Object.assign({ align: "right" }, { children: formatDuration(track.duration_ms || 0) })), (0, jsx_runtime_1.jsx)(material_1.TableCell, Object.assign({ align: "right" }, { children: track.preview_url ? ((0, jsx_runtime_1.jsx)(material_1.Tooltip, Object.assign({ title: playingTrackId === track.id ? 'Pause' : 'Play Preview' }, { children: (0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ onClick: () => handlePlayPause(track), color: playingTrackId === track.id ? 'primary' : 'default' }, { children: playingTrackId === track.id ? (0, jsx_runtime_1.jsx)(icons_material_1.Pause, {}) : (0, jsx_runtime_1.jsx)(icons_material_1.PlayArrow, {}) })) }))) : ((0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "caption", color: "text.secondary" }, { children: "No preview" }))) }))] }), track.id));
                                        }) })] })) })))] }))] })) })));
};
exports.default = TrackManager;
