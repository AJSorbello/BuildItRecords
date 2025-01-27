"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LABELS = exports.RECORD_LABELS = exports.API_URL = void 0;
exports.API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/api$/, '');
exports.RECORD_LABELS = {
    'buildit-records': {
        id: 'buildit-records',
        name: 'Build It Records',
        displayName: 'Build It Records',
    },
    'buildit-tech': {
        id: 'buildit-tech',
        name: 'Build It Tech',
        displayName: 'Build It Tech',
    },
    'buildit-deep': {
        id: 'buildit-deep',
        name: 'Build It Deep',
        displayName: 'Build It Deep',
    }
};
exports.LABELS = [
    exports.RECORD_LABELS['buildit-records'],
    exports.RECORD_LABELS['buildit-tech'],
    exports.RECORD_LABELS['buildit-deep']
];
const config = {
    API_URL: exports.API_URL,
    LABELS: exports.LABELS,
    RECORD_LABELS: exports.RECORD_LABELS
};
exports.default = config;
