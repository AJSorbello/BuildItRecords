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
const SpotifyService_1 = require("../services/SpotifyService");
const ReleaseCard_1 = __importDefault(require("./ReleaseCard"));
const TOP_RELEASES_LIMIT = 10;
const TopReleases = ({ label }) => {
    const [topReleases, setTopReleases] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const fetchTopReleases = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                setLoading(true);
                const releases = yield SpotifyService_1.spotifyService.getTracksByLabel(label);
                const sortedReleases = releases
                    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                    .slice(0, TOP_RELEASES_LIMIT);
                setTopReleases(sortedReleases);
            }
            catch (error) {
                console.error('Error fetching top releases:', error);
            }
            finally {
                setLoading(false);
            }
        });
        fetchTopReleases();
    }, [label]);
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { textAlign: 'center', py: 4 } }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, { children: "Loading top releases..." }) })));
    }
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { py: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true, sx: {
                    mb: 3,
                    fontWeight: 'bold',
                    textAlign: 'center'
                } }, { children: "Top 10 Releases" })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 3, justifyContent: "center" }, { children: topReleases.map((track, index) => ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4, lg: 3 }, { children: (0, jsx_runtime_1.jsx)(ReleaseCard_1.default, { track: track, ranking: index + 1 }) }), track.id))) }))] })));
};
exports.default = TopReleases;
