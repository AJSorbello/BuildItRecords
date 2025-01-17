"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortByDate = exports.formatDate = void 0;
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};
exports.formatDate = formatDate;
const sortByDate = (a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
};
exports.sortByDate = sortByDate;
