"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.labelIdToKey = exports.getLabelByName = exports.getLabelById = exports.getAllLabels = exports.LABEL_COLORS = exports.LABEL_DESCRIPTIONS = exports.LABEL_DISPLAY_NAMES = exports.RECORD_LABELS = void 0;
// Core labels that are always available
exports.RECORD_LABELS = {
    'buildit-records': {
        id: 'buildit-records',
        name: 'Records',
        displayName: 'Build It Records',
    },
    'buildit-tech': {
        id: 'buildit-tech',
        name: 'Tech',
        displayName: 'Build It Tech',
    },
    'buildit-deep': {
        id: 'buildit-deep',
        name: 'Deep',
        displayName: 'Build It Deep',
    }
};
// Label display names
exports.LABEL_DISPLAY_NAMES = {
    'buildit-records': 'Build It Records',
    'buildit-tech': 'Build It Tech',
    'buildit-deep': 'Build It Deep'
};
// Label descriptions
exports.LABEL_DESCRIPTIONS = {
    'buildit-records': 'The main label for Build It Records, featuring a diverse range of electronic music.',
    'buildit-tech': 'Our techno-focused sublabel, delivering cutting-edge underground sounds.',
    'buildit-deep': 'Deep and melodic electronic music from emerging and established artists.'
};
// Label colors
exports.LABEL_COLORS = {
    'buildit-records': '#FF4081',
    'buildit-tech': '#00BCD4',
    'buildit-deep': '#7C4DFF'
};
// Helper functions
const getAllLabels = () => Object.values(exports.RECORD_LABELS);
exports.getAllLabels = getAllLabels;
const getLabelById = (id) => exports.RECORD_LABELS[id];
exports.getLabelById = getLabelById;
const getLabelByName = (name) => Object.values(exports.RECORD_LABELS).find(label => label.name.toLowerCase() === name.toLowerCase());
exports.getLabelByName = getLabelByName;
const labelIdToKey = (id) => {
    const label = (0, exports.getLabelById)(id);
    return label ? label.name.toUpperCase() : undefined;
};
exports.labelIdToKey = labelIdToKey;
