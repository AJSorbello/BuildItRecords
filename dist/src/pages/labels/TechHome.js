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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const material_1 = require("@mui/material");
const ReleaseCard_1 = __importDefault(require("../../components/ReleaseCard"));
const DatabaseService_1 = require("../../services/DatabaseService");
const TechHome = () => {
    const [releases, setReleases] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const fetchReleases = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                setLoading(true);
                const fetchedReleases = yield DatabaseService_1.databaseService.getReleasesForLabel('buildit-tech');
                setReleases(fetchedReleases);
            }
            catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch releases'));
            }
            finally {
                setLoading(false);
            }
        });
        fetchReleases();
    }, []);
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }, { children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) })));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }, { children: (0, jsx_runtime_1.jsx)(material_1.Alert, Object.assign({ severity: "error" }, { children: error.message })) })));
    }
    return ((0, jsx_runtime_1.jsx)(material_1.Container, Object.assign({ maxWidth: "xl" }, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { py: 4 } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", component: "h1", gutterBottom: true, sx: { color: '#fff' } }, { children: "Latest Releases" })), (0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: releases.map((release) => ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4, lg: 3 }, { children: (0, jsx_runtime_1.jsx)(ReleaseCard_1.default, { release: release }) }), release.id))) }))] })) })));
};
exports.default = TechHome;
