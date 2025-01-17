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
exports.useSpotifyPlaylists = void 0;
const react_1 = require("react");
const trackUtils_1 = require("../utils/trackUtils");
const spotify_1 = require("../services/spotify");
function useSpotifyPlaylists(playlistId) {
    const [tracks, setTracks] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const fetchTracks = () => __awaiter(this, void 0, void 0, function* () {
            try {
                setLoading(true);
                const response = yield spotify_1.spotifyService.getPlaylistTracks(playlistId);
                const spotifyTracks = response.items
                    .map(item => item.track)
                    .filter((track) => track !== null);
                const transformedTracks = spotifyTracks.map(trackUtils_1.transformSpotifyTrack);
                setTracks(transformedTracks);
                setError(null);
            }
            catch (err) {
                console.error('Error fetching playlist tracks:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch tracks');
            }
            finally {
                setLoading(false);
            }
        });
        if (playlistId) {
            fetchTracks();
        }
    }, [playlistId]);
    return { tracks, loading, error };
}
exports.useSpotifyPlaylists = useSpotifyPlaylists;
