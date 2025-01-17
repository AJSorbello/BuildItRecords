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
const DatabaseService_1 = require("../services/DatabaseService");
const FeaturedRelease_1 = __importDefault(require("../components/FeaturedRelease"));
const ReleaseCard_1 = __importDefault(require("../components/ReleaseCard"));
const react_router_dom_1 = require("react-router-dom");
const HomePage = () => {
    const [featuredTrack, setFeaturedTrack] = (0, react_1.useState)(null);
    const [recentTracks, setRecentTracks] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const navigate = (0, react_router_dom_1.useNavigate)();
    (0, react_1.useEffect)(() => {
        const fetchData = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                setLoading(true);
                // Get recent tracks
                const tracks = yield DatabaseService_1.databaseService.getTracksFromApi();
                if (tracks.length > 0) {
                    // Set the first track as featured
                    setFeaturedTrack(tracks[0]);
                    // Set the rest as recent tracks (up to 6)
                    setRecentTracks(tracks.slice(1, 7));
                }
            }
            catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load content');
            }
            finally {
                setLoading(false);
            }
        });
        fetchData();
    }, []);
    const handleTrackClick = (track) => {
        var _a;
        if ((_a = track.artists[0]) === null || _a === void 0 ? void 0 : _a.id) {
            navigate(`/artists/${track.artists[0].id}`);
        }
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }, { children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) })));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)(material_1.Container, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "error", align: "center" }, { children: error })) }));
    }
    return ((0, jsx_runtime_1.jsxs)(material_1.Container, Object.assign({ maxWidth: "lg", sx: { py: 4 } }, { children: [featuredTrack && ((0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { mb: 6 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", gutterBottom: true }, { children: "Featured Release" })), (0, jsx_runtime_1.jsx)(FeaturedRelease_1.default, { track: featuredTrack })] }))), recentTracks.length > 0 && ((0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", gutterBottom: true }, { children: "Recent Releases" })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: recentTracks.map((track) => ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4 }, { children: (0, jsx_runtime_1.jsx)(ReleaseCard_1.default, { track: track, onClick: () => handleTrackClick(track) }) }), track.id))) }))] }))] })));
};
exports.default = HomePage;
