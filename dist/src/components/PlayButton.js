"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const material_1 = require("@mui/material");
const fa_1 = require("react-icons/fa");
const PlayButton = ({ previewUrl, size = 'medium', sx }) => {
    const [audio] = (0, react_1.useState)(new Audio());
    const [isPlaying, setIsPlaying] = (0, react_1.useState)(false);
    const handlePlay = () => {
        if (!previewUrl)
            return;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        }
        else {
            audio.src = previewUrl;
            audio.play().catch(error => {
                console.error('Error playing audio:', error);
                setIsPlaying(false);
            });
            setIsPlaying(true);
        }
    };
    // Clean up audio on unmount
    react_1.default.useEffect(() => {
        return () => {
            audio.pause();
            audio.src = '';
        };
    }, [audio]);
    if (!previewUrl) {
        return null;
    }
    return ((0, jsx_runtime_1.jsx)(material_1.Tooltip, Object.assign({ title: isPlaying ? 'Pause' : 'Play Preview' }, { children: (0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ onClick: handlePlay, size: size, sx: Object.assign({ color: 'primary.main' }, sx) }, { children: isPlaying ? (0, jsx_runtime_1.jsx)(fa_1.FaPause, {}) : (0, jsx_runtime_1.jsx)(fa_1.FaPlay, {}) })) })));
};
exports.default = PlayButton;
