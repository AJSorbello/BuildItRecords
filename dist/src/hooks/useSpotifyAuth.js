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
exports.useSpotifyAuth = void 0;
const react_1 = require("react");
const spotifyAuth_1 = require("../utils/spotifyAuth");
const useSpotifyAuth = () => {
    const [authState, setAuthState] = (0, react_1.useState)({
        accessToken: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
    });
    const checkAndRefreshToken = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        const accessToken = localStorage.getItem('spotify_access_token');
        const refreshToken = localStorage.getItem('spotify_refresh_token');
        const tokenExpiry = localStorage.getItem('spotify_token_expiry');
        if (!accessToken || !refreshToken) {
            setAuthState({
                accessToken: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });
            return;
        }
        // Check if token needs refresh
        if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
            try {
                const data = yield (0, spotifyAuth_1.refreshAccessToken)(refreshToken);
                localStorage.setItem('spotify_access_token', data.access_token);
                localStorage.setItem('spotify_token_expiry', String(Date.now() + data.expires_in * 1000));
                setAuthState({
                    accessToken: data.access_token,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                });
            }
            catch (error) {
                setAuthState({
                    accessToken: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: 'Failed to refresh token',
                });
            }
        }
        else {
            setAuthState({
                accessToken,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });
        }
    }), []);
    (0, react_1.useEffect)(() => {
        checkAndRefreshToken();
    }, [checkAndRefreshToken]);
    const logout = (0, react_1.useCallback)(() => {
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_token_expiry');
        setAuthState({
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
        });
    }, []);
    return Object.assign(Object.assign({}, authState), { refreshToken: checkAndRefreshToken, logout });
};
exports.useSpotifyAuth = useSpotifyAuth;
