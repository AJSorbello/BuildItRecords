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
exports.useSpotifySearch = void 0;
const react_1 = require("react");
const spotify_1 = require("../services/spotify");
const useDebounce_1 = require("./useDebounce");
function useSpotifySearch(query, types, options = {}) {
    const [tracks, setTracks] = (0, react_1.useState)([]);
    const [artists, setArtists] = (0, react_1.useState)([]);
    const [albums, setAlbums] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const debouncedQuery = (0, useDebounce_1.useDebounce)(query, 300);
    const performSearch = (0, react_1.useCallback)(() => __awaiter(this, void 0, void 0, function* () {
        if (!debouncedQuery.trim()) {
            setTracks([]);
            setArtists([]);
            setAlbums([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = yield spotify_1.spotifyService.search(debouncedQuery, types, {
                limit: options.limit || 20,
                offset: options.offset || 0,
                market: options.market,
                includeExternal: options.includeExternal,
            });
            if (response.tracks && types.includes('track')) {
                setTracks(response.tracks.items);
            }
            if (response.artists && types.includes('artist')) {
                setArtists(response.artists.items);
            }
            if (response.albums && types.includes('album')) {
                setAlbums(response.albums.items);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while searching');
            setTracks([]);
            setArtists([]);
            setAlbums([]);
        }
        finally {
            setLoading(false);
        }
    }), [debouncedQuery, types, options]);
    (0, react_1.useEffect)(() => {
        performSearch();
    }, [performSearch]);
    return {
        tracks,
        artists,
        albums,
        loading,
        error,
    };
}
exports.useSpotifySearch = useSpotifySearch;
