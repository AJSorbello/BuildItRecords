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
exports.clearSpotifyApi = exports.getSpotifyApi = exports.initializeSpotify = exports.refreshAccessToken = exports.getAccessToken = exports.initiateSpotifyLogin = exports.spotifyConfig = exports.generateCodeChallenge = exports.generateRandomString = void 0;
// Function to generate a random string for the state parameter
const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};
exports.generateRandomString = generateRandomString;
// Function to generate code challenge from verifier
const generateCodeChallenge = (codeVerifier) => __awaiter(void 0, void 0, void 0, function* () {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = yield window.crypto.subtle.digest('SHA-256', data);
    // Convert ArrayBuffer to string using Uint8Array
    const base64 = btoa(Array.from(new Uint8Array(digest))
        .map(byte => String.fromCharCode(byte))
        .join(''));
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
});
exports.generateCodeChallenge = generateCodeChallenge;
// Spotify authentication configuration
exports.spotifyConfig = {
    clientId: process.env.REACT_APP_SPOTIFY_CLIENT_ID,
    redirectUri: 'http://localhost:3000/callback',
    authEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
    scopes: [
        'user-read-private',
        'user-read-email',
        'playlist-read-private',
        'playlist-read-collaborative'
    ]
};
// Function to initiate Spotify login
const initiateSpotifyLogin = () => __awaiter(void 0, void 0, void 0, function* () {
    const codeVerifier = (0, exports.generateRandomString)(64);
    const codeChallenge = yield (0, exports.generateCodeChallenge)(codeVerifier);
    const state = (0, exports.generateRandomString)(16);
    // Store code verifier and state in localStorage for later verification
    localStorage.setItem('code_verifier', codeVerifier);
    localStorage.setItem('state', state);
    const params = new URLSearchParams({
        client_id: exports.spotifyConfig.clientId,
        response_type: 'code',
        redirect_uri: exports.spotifyConfig.redirectUri,
        state: state,
        scope: exports.spotifyConfig.scopes.join(' '),
        code_challenge_method: 'S256',
        code_challenge: codeChallenge
    });
    window.location.href = `${exports.spotifyConfig.authEndpoint}?${params.toString()}`;
});
exports.initiateSpotifyLogin = initiateSpotifyLogin;
// Function to exchange code for access token
const getAccessToken = (code) => __awaiter(void 0, void 0, void 0, function* () {
    const verifier = localStorage.getItem('code_verifier');
    const params = new URLSearchParams({
        client_id: exports.spotifyConfig.clientId,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: exports.spotifyConfig.redirectUri,
        code_verifier: verifier
    });
    const response = yield fetch(exports.spotifyConfig.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });
    if (!response.ok) {
        throw new Error('Failed to get access token');
    }
    const data = yield response.json();
    return data;
});
exports.getAccessToken = getAccessToken;
// Function to refresh access token
const refreshAccessToken = (refresh_token) => __awaiter(void 0, void 0, void 0, function* () {
    const params = new URLSearchParams({
        client_id: exports.spotifyConfig.clientId,
        grant_type: 'refresh_token',
        refresh_token: refresh_token
    });
    const response = yield fetch(exports.spotifyConfig.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });
    if (!response.ok) {
        throw new Error('Failed to refresh token');
    }
    const data = yield response.json();
    return data;
});
exports.refreshAccessToken = refreshAccessToken;
const web_api_ts_sdk_1 = require("@spotify/web-api-ts-sdk");
const env_1 = require("../config/env");
let spotifyApi = null;
function initializeSpotify() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!spotifyApi) {
            spotifyApi = web_api_ts_sdk_1.SpotifyApi.withClientCredentials(env_1.SPOTIFY_CONFIG.CLIENT_ID, env_1.SPOTIFY_CONFIG.CLIENT_SECRET);
        }
        return spotifyApi;
    });
}
exports.initializeSpotify = initializeSpotify;
function getSpotifyApi() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!spotifyApi) {
            return initializeSpotify();
        }
        return spotifyApi;
    });
}
exports.getSpotifyApi = getSpotifyApi;
function clearSpotifyApi() {
    spotifyApi = null;
}
exports.clearSpotifyApi = clearSpotifyApi;
