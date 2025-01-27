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
exports.useAuth = exports.AuthProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const SpotifyService_1 = require("../services/SpotifyService");
const AuthContext = (0, react_1.createContext)(undefined);
// Replace React Native AsyncStorage with localStorage
const storage = {
    getItem: (key) => __awaiter(void 0, void 0, void 0, function* () {
        return localStorage.getItem(key);
    }),
    setItem: (key, value) => __awaiter(void 0, void 0, void 0, function* () {
        localStorage.setItem(key, value);
    }),
    removeItem: (key) => __awaiter(void 0, void 0, void 0, function* () {
        localStorage.removeItem(key);
    }),
    multiRemove: (keys) => __awaiter(void 0, void 0, void 0, function* () {
        keys.forEach(key => localStorage.removeItem(key));
    })
};
const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const initAuth = () => __awaiter(void 0, void 0, void 0, function* () {
            const isAuthed = yield SpotifyService_1.spotifyService.init();
            setIsAuthenticated(isAuthed);
        });
        initAuth();
    }, []);
    const login = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const loginUrl = yield SpotifyService_1.spotifyService.getLoginUrl();
            window.location.href = loginUrl;
        }
        catch (error) {
            console.error('Login failed:', error);
        }
    });
    const logout = () => {
        setIsAuthenticated(false);
    };
    const value = {
        isAuthenticated,
        login,
        logout,
    };
    return (0, jsx_runtime_1.jsx)(AuthContext.Provider, Object.assign({ value: value }, { children: children }));
};
exports.AuthProvider = AuthProvider;
const useAuth = () => {
    const context = (0, react_1.useContext)(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
exports.useAuth = useAuth;
exports.default = AuthContext;
