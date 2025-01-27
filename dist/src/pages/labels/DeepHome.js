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
const trackUtils_1 = require("../../utils/trackUtils");
const TrackList_1 = __importDefault(require("../../components/TrackList"));
const PageLayout_1 = __importDefault(require("../../components/PageLayout"));
const DeepHome = () => {
    const [latestTracks, setLatestTracks] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const fetchTracks = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                setLoading(true);
                const tracks = yield (0, trackUtils_1.getTracksForLabel)('buildit-deep');
                if (tracks && tracks.length > 0) {
                    const sortedTracks = tracks.sort((a, b) => {
                        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
                        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
                        return dateB - dateA;
                    });
                    setLatestTracks(sortedTracks.slice(0, 10)); // Get the 10 most recent tracks
                }
                else {
                    setLatestTracks([]);
                }
                setError(null);
            }
            catch (err) {
                console.error('Error fetching tracks:', err);
                setError('Failed to load tracks');
                setLatestTracks([]);
            }
            finally {
                setLoading(false);
            }
        });
        fetchTracks();
    }, []);
    return ((0, jsx_runtime_1.jsx)(PageLayout_1.default, Object.assign({ label: "deep" }, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                maxWidth: '900px',
                mx: 'auto',
                mt: 2,
                px: 2
            } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h3", component: "h1", gutterBottom: true, sx: {
                        color: '#FFFFFF',
                        mb: 4,
                        fontWeight: 'bold',
                        textAlign: 'center'
                    } }, { children: "Build It Deep" })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h6", component: "h2", gutterBottom: true, sx: {
                        color: '#B3B3B3',
                        mb: 4,
                        textAlign: 'center'
                    } }, { children: "Deep and melodic electronic music from emerging and established artists" })), (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { width: '100%', mt: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true, sx: { color: '#FFFFFF', mb: 3 } }, { children: "Latest Releases" })), (0, jsx_runtime_1.jsx)(TrackList_1.default, { tracks: latestTracks, loading: loading, error: error })] }))] })) })));
};
exports.default = DeepHome;
