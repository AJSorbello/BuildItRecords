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
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const spotifyAuth_1 = require("../utils/spotifyAuth");
const SpotifyCallback = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const handleCallback = () => __awaiter(void 0, void 0, void 0, function* () {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const storedState = localStorage.getItem('state');
            // Verify state to prevent CSRF attacks
            if (state === null || state !== storedState) {
                setError('State verification failed');
                return;
            }
            if (code) {
                try {
                    const data = yield (0, spotifyAuth_1.getAccessToken)(code);
                    // Store tokens securely
                    localStorage.setItem('spotify_access_token', data.access_token);
                    localStorage.setItem('spotify_refresh_token', data.refresh_token);
                    localStorage.setItem('spotify_token_expiry', String(Date.now() + data.expires_in * 1000));
                    // Clean up
                    localStorage.removeItem('state');
                    localStorage.removeItem('code_verifier');
                    // Redirect to home or dashboard
                    navigate('/');
                }
                catch (err) {
                    setError('Failed to get access token');
                    console.error(err);
                }
            }
        });
        handleCallback();
    }, [navigate]);
    if (error) {
        return (0, jsx_runtime_1.jsxs)("div", { children: ["Error: ", error] });
    }
    return (0, jsx_runtime_1.jsx)("div", { children: "Loading..." });
};
exports.default = SpotifyCallback;
