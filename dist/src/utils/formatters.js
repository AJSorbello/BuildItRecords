"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDuration = void 0;
const formatDuration = (ms) => {
    if (!ms)
        return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
exports.formatDuration = formatDuration;
