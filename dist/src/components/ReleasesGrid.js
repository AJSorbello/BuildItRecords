"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const ReleaseCard_1 = __importDefault(require("./ReleaseCard"));
const ReleasesGrid = ({ releases, isLoading, error }) => {
    if (isLoading) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px',
            } }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, { children: "Loading releases..." }) })));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px',
            } }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "error" }, { children: error.message })) })));
    }
    if (!releases.length) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px',
            } }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, { children: "No releases found" }) })));
    }
    const featuredRelease = releases[0];
    const otherReleases = releases.slice(1);
    return ((0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: [featuredRelease && ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12 }, { children: (0, jsx_runtime_1.jsx)(ReleaseCard_1.default, { release: featuredRelease, featured: true }) }))), otherReleases.map((release) => ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4 }, { children: (0, jsx_runtime_1.jsx)(ReleaseCard_1.default, { release: release }) }), release.id)))] })));
};
exports.default = ReleasesGrid;
