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
exports.useSpotifyArtists = void 0;
const react_1 = require("react");
const spotify_1 = require("../services/spotify");
function useSpotifyArtists(artistIds) {
    const [artists, setArtists] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const fetchArtists = () => __awaiter(this, void 0, void 0, function* () {
            if (!artistIds.length) {
                setArtists([]);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const fetchedArtists = yield spotify_1.spotifyService.getArtists(artistIds);
                setArtists(fetchedArtists);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch artists');
                setArtists([]);
            }
            finally {
                setLoading(false);
            }
        });
        fetchArtists();
    }, [artistIds]);
    return { artists, loading, error };
}
exports.useSpotifyArtists = useSpotifyArtists;
