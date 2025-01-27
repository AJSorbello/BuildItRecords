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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LABELS = exports.API_URL = void 0;
const env_1 = require("./env");
exports.API_URL = env_1.API_CONFIG.BASE_URL;
exports.LABELS = [
    {
        id: 'buildit-records',
        displayName: 'Build It Records',
        spotifyIds: []
    },
    {
        id: 'buildit-tech',
        displayName: 'Build It Tech',
        spotifyIds: []
    },
    {
        id: 'buildit-deep',
        displayName: 'Build It Deep',
        spotifyIds: []
    }
];
// Export everything from env.ts
__exportStar(require("./env"), exports);
