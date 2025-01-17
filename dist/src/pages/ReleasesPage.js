"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const material_1 = require("@mui/material");
const components_1 = require("../components");
const useReleases_1 = require("../hooks/useReleases");
const labels_1 = require("../constants/labels");
const ReleasesPage = ({ label }) => {
    var _a;
    // Get label from URL path (e.g., /records/releases -> records)
    const { loading, error, releases } = (0, useReleases_1.useReleases)({ label });
    const [currentPage, setCurrentPage] = (0, react_1.useState)(1);
    const itemsPerPage = 12;
    if (loading)
        return (0, jsx_runtime_1.jsx)(components_1.LoadingSpinner, {});
    if (error)
        return (0, jsx_runtime_1.jsx)(components_1.ErrorMessage, { message: error });
    if (!(releases === null || releases === void 0 ? void 0 : releases.length)) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { mt: 8, textAlign: 'center' } }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", color: "text.secondary" }, { children: "No releases found" })) })));
    }
    const labelDisplayName = ((_a = labels_1.RECORD_LABELS[label]) === null || _a === void 0 ? void 0 : _a.displayName) || 'Releases';
    return ((0, jsx_runtime_1.jsxs)(material_1.Container, Object.assign({ maxWidth: "xl", sx: { mt: 8, mb: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", component: "h1", gutterBottom: true }, { children: labelDisplayName })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: releases.map((release) => ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4, lg: 3 }, { children: (0, jsx_runtime_1.jsx)(components_1.ReleaseCard, { release: release }) }), release.id))) }))] })));
};
exports.default = ReleasesPage;
