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
exports.useSpotifyFollow = void 0;
const react_1 = require("react");
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
    })
};
const useSpotifyFollow = (labelId) => {
    const [isFollowing, setIsFollowing] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        // Load follow state on mount
        loadFollowState();
    }, []);
    const loadFollowState = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const followState = yield storage.getItem(`spotify_follow_${labelId}`);
            setIsFollowing(followState === 'true');
        }
        catch (error) {
            console.error('Error loading follow state:', error);
        }
    });
    const handleFollow = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield storage.setItem(`spotify_follow_${labelId}`, 'true');
            setIsFollowing(true);
        }
        catch (error) {
            console.error('Error saving follow state:', error);
        }
    });
    return { isFollowing, handleFollow };
};
exports.useSpotifyFollow = useSpotifyFollow;
