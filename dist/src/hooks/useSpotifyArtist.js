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
exports.useSpotifyArtist = void 0;
const react_1 = require("react");
const spotify_1 = require("../services/spotify");
function useSpotifyArtist(artistId, options = {}) {
    const [artist, setArtist] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const fetchArtist = () => __awaiter(this, void 0, void 0, function* () {
            if (!artistId) {
                setArtist(null);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const artistData = yield spotify_1.spotifyService.getArtist(artistId);
                // Fetch additional data if requested
                const [topTracks, albums, relatedArtists] = yield Promise.all([
                    options.includeTopTracks
                        ? spotify_1.spotifyService.getArtistTopTracks(artistId, options.market)
                        : Promise.resolve(undefined),
                    options.includeAlbums
                        ? spotify_1.spotifyService.getArtistAlbums(artistId, {
                            include_groups: ['album', 'single'],
                            market: options.market,
                            limit: 50
                        })
                        : Promise.resolve(undefined),
                    options.includeRelatedArtists
                        ? spotify_1.spotifyService.getRelatedArtists(artistId)
                        : Promise.resolve(undefined)
                ]);
                setArtist(Object.assign(Object.assign({}, artistData), { topTracks,
                    albums,
                    relatedArtists }));
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch artist');
                setArtist(null);
            }
            finally {
                setLoading(false);
            }
        });
        fetchArtist();
    }, [
        artistId,
        options.includeTopTracks,
        options.includeAlbums,
        options.includeRelatedArtists,
        options.market
    ]);
    return { artist, loading, error };
}
exports.useSpotifyArtist = useSpotifyArtist;
