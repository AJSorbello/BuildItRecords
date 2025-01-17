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
const lodash_1 = require("lodash");
const react_router_dom_1 = require("react-router-dom");
const DatabaseService_1 = require("../services/DatabaseService");
const ArtistCard_1 = __importDefault(require("../components/ArtistCard"));
const icons_material_1 = require("@mui/icons-material");
const ITEMS_PER_PAGE = 12;
const ArtistsPage = () => {
    const [artists, setArtists] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [searchState, setSearchState] = (0, react_1.useState)({
        total: 0,
        page: 1,
    });
    const location = (0, react_router_dom_1.useLocation)();
    // Determine the label based on the current route
    const getLabel = (0, react_1.useMemo)(() => {
        const path = location.pathname.toLowerCase();
        if (path.includes('/records/artists'))
            return 'Build It Records';
        if (path.includes('/tech/artists'))
            return 'Build It Tech';
        if (path.includes('/deep/artists'))
            return 'Build It Deep';
        return undefined;
    }, [location.pathname]);
    const debouncedSearch = (0, react_1.useMemo)(() => (0, lodash_1.debounce)((query) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            setLoading(true);
            const response = yield DatabaseService_1.databaseService.getArtists(query.trim(), searchState.page, ITEMS_PER_PAGE);
            setArtists(response.artists || []);
            setSearchState(Object.assign(Object.assign({}, searchState), { total: response.total }));
            setError(null);
        }
        catch (err) {
            if (err instanceof DatabaseService_1.DatabaseApiError) {
                setError(err.message);
            }
            else {
                setError('Failed to load artists');
            }
            setArtists([]);
        }
        finally {
            setLoading(false);
        }
    }), 500), [searchState.page]);
    (0, react_1.useEffect)(() => {
        debouncedSearch(searchQuery);
        return () => {
            debouncedSearch.cancel();
        };
    }, [searchQuery, debouncedSearch]);
    const handleSearchChange = (event) => {
        const query = event.target.value;
        setSearchQuery(query);
        setSearchState(Object.assign(Object.assign({}, searchState), { page: 1 })); // Reset to first page on new search
    };
    const handlePageChange = (_, page) => {
        setSearchState(Object.assign(Object.assign({}, searchState), { page }));
    };
    const handleRetry = () => {
        debouncedSearch(searchQuery);
    };
    const totalPages = Math.ceil(searchState.total / ITEMS_PER_PAGE);
    return ((0, jsx_runtime_1.jsx)(material_1.Container, Object.assign({ maxWidth: "lg" }, { children: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { py: 4 } }, { children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, Object.assign({ variant: "h4", component: "h1", gutterBottom: true }, { children: ["Artists ", getLabel ? `- ${getLabel}` : ''] })), (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Search Artists", variant: "outlined", value: searchQuery, onChange: handleSearchChange, disabled: loading, sx: { mb: 4 } }), error ? ((0, jsx_runtime_1.jsx)(material_1.Alert, Object.assign({ severity: "error", sx: { mb: 2 }, action: (0, jsx_runtime_1.jsx)(material_1.Button, Object.assign({ color: "inherit", size: "small", onClick: handleRetry, startIcon: (0, jsx_runtime_1.jsx)(icons_material_1.Refresh, {}) }, { children: "Retry" })) }, { children: error }))) : null, loading ? ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: [...Array(ITEMS_PER_PAGE)].map((_, index) => ((0, jsx_runtime_1.jsxs)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4, lg: 3 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Skeleton, { variant: "rectangular", height: 200 }), (0, jsx_runtime_1.jsx)(material_1.Skeleton, { variant: "text", sx: { mt: 1 } }), (0, jsx_runtime_1.jsx)(material_1.Skeleton, { variant: "text", width: "60%" })] }), index))) }))) : artists.length > 0 ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ container: true, spacing: 3 }, { children: artists.map((artist) => ((0, jsx_runtime_1.jsx)(material_1.Grid, Object.assign({ item: true, xs: 12, sm: 6, md: 4, lg: 3 }, { children: (0, jsx_runtime_1.jsx)(ArtistCard_1.default, { artist: artist }) }), artist.id))) })), totalPages > 1 && ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ display: "flex", justifyContent: "center", mt: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.Pagination, { count: totalPages, page: searchState.page, onChange: handlePageChange, color: "primary" }) })))] })) : ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ textAlign: "center", py: 4 }, { children: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h6", color: "text.secondary" }, { children: searchQuery
                            ? 'No artists found matching your search'
                            : 'No artists found' })) })))] })) })));
};
exports.default = ArtistsPage;
