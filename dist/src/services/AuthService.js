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
exports.authService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
class AuthService {
    login(credentials) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.post(`${config_1.API_URL}/auth/login`, credentials);
                const { token, expiresIn } = response.data;
                // Store token in an HTTP-only cookie (handled by backend)
                // We only store the expiry time in localStorage for UI purposes
                localStorage.setItem(AuthService.TOKEN_EXPIRY_KEY, (Date.now() + expiresIn * 1000).toString());
                return true;
            }
            catch (error) {
                console.error('Login failed:', error);
                throw error;
            }
        });
    }
    logout() {
        // Clear local storage
        localStorage.removeItem(AuthService.TOKEN_EXPIRY_KEY);
        // Call backend to clear HTTP-only cookie
        axios_1.default.post(`${config_1.API_URL}/auth/logout`)
            .catch(error => console.error('Logout error:', error));
    }
    isAuthenticated() {
        const expiryTime = localStorage.getItem(AuthService.TOKEN_EXPIRY_KEY);
        if (!expiryTime)
            return false;
        return Date.now() < parseInt(expiryTime);
    }
    refreshToken() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.post(`${config_1.API_URL}/auth/refresh`);
                const { expiresIn } = response.data;
                localStorage.setItem(AuthService.TOKEN_EXPIRY_KEY, (Date.now() + expiresIn * 1000).toString());
            }
            catch (error) {
                console.error('Token refresh failed:', error);
                this.logout();
                throw error;
            }
        });
    }
    // Setup axios interceptor for automatic token refresh
    setupAxiosInterceptors() {
        axios_1.default.interceptors.response.use(response => response, (error) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const originalRequest = error.config;
            if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    yield this.refreshToken();
                    return (0, axios_1.default)(originalRequest);
                }
                catch (refreshError) {
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        }));
    }
}
AuthService.TOKEN_KEY = 'auth_token';
AuthService.TOKEN_EXPIRY_KEY = 'auth_expiry';
exports.authService = new AuthService();
exports.default = exports.authService;
