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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSpotifyTracks = void 0;
const react_1 = require("react");
const spotify_1 = require("../services/spotify");
function useSpotifyTracks(trackIds, market) {
    const [tracks, setTracks] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const fetchTracks = () => __awaiter(this, void 0, void 0, function* () {
            if (!trackIds.length) {
                setTracks([]);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const fetchedTracks = yield spotify_1.spotifyService.getTracks(trackIds, market);
                setTracks(fetchedTracks);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch tracks');
                setTracks([]);
            }
            finally {
                setLoading(false);
            }
        });
        fetchTracks();
    }, [trackIds, market]);
    return { tracks, loading, error };
}
exports.useSpotifyTracks = useSpotifyTracks;
