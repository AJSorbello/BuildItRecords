"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
const material_1 = require("@mui/material");
const Layout_1 = require("./components/Layout");
const theme_1 = require("./theme/theme");
require("./styles/global.css");
// Import pages
const RecordsHome_1 = __importDefault(require("./pages/labels/RecordsHome"));
const TechHome_1 = __importDefault(require("./pages/labels/TechHome"));
const DeepHome_1 = __importDefault(require("./pages/labels/DeepHome"));
const ReleasesPage_1 = __importDefault(require("./pages/ReleasesPage"));
const ArtistsPage_1 = __importDefault(require("./pages/ArtistsPage"));
const PlaylistsPage_1 = __importDefault(require("./pages/PlaylistsPage"));
const SubmitPage_1 = __importDefault(require("./pages/SubmitPage"));
const NotFoundPage_1 = __importDefault(require("./pages/NotFoundPage"));
const LegalPage_1 = __importDefault(require("./pages/LegalPage"));
const AdminLogin_1 = __importDefault(require("./pages/admin/AdminLogin"));
const AdminDashboard_1 = __importDefault(require("./pages/admin/AdminDashboard"));
const ArtistDetailPage_1 = __importDefault(require("./pages/ArtistDetailPage"));
// Protected Route component
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        return (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/admin/login", replace: true });
    }
    return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children });
};
const router = (0, react_router_dom_1.createBrowserRouter)((0, react_router_dom_1.createRoutesFromElements)((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(react_router_dom_1.Route, Object.assign({ path: "/admin" }, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "login", element: (0, jsx_runtime_1.jsx)(AdminLogin_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "dashboard", element: (0, jsx_runtime_1.jsx)(ProtectedRoute, { children: (0, jsx_runtime_1.jsx)(AdminDashboard_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { index: true, element: localStorage.getItem('adminToken') ?
                        (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/admin/dashboard", replace: true }) :
                        (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/admin/login", replace: true }) })] })), (0, jsx_runtime_1.jsxs)(react_router_dom_1.Route, Object.assign({ path: "/", element: (0, jsx_runtime_1.jsx)(Layout_1.Layout, {}) }, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { index: true, element: (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/records", replace: true }) }), (0, jsx_runtime_1.jsxs)(react_router_dom_1.Route, Object.assign({ path: "records" }, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { index: true, element: (0, jsx_runtime_1.jsx)(RecordsHome_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "releases", element: (0, jsx_runtime_1.jsx)(ReleasesPage_1.default, { label: "buildit-records" }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "artists", element: (0, jsx_runtime_1.jsx)(ArtistsPage_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "artists/:id", element: (0, jsx_runtime_1.jsx)(ArtistDetailPage_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "playlists", element: (0, jsx_runtime_1.jsx)(PlaylistsPage_1.default, { label: "records" }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "submit", element: (0, jsx_runtime_1.jsx)(SubmitPage_1.default, { label: "records" }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "legal", element: (0, jsx_runtime_1.jsx)(LegalPage_1.default, {}) })] })), (0, jsx_runtime_1.jsxs)(react_router_dom_1.Route, Object.assign({ path: "tech" }, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { index: true, element: (0, jsx_runtime_1.jsx)(TechHome_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "releases", element: (0, jsx_runtime_1.jsx)(ReleasesPage_1.default, { label: "buildit-tech" }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "artists", element: (0, jsx_runtime_1.jsx)(ArtistsPage_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "artists/:id", element: (0, jsx_runtime_1.jsx)(ArtistDetailPage_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "playlists", element: (0, jsx_runtime_1.jsx)(PlaylistsPage_1.default, { label: "tech" }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "submit", element: (0, jsx_runtime_1.jsx)(SubmitPage_1.default, { label: "tech" }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "legal", element: (0, jsx_runtime_1.jsx)(LegalPage_1.default, {}) })] })), (0, jsx_runtime_1.jsxs)(react_router_dom_1.Route, Object.assign({ path: "deep" }, { children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { index: true, element: (0, jsx_runtime_1.jsx)(DeepHome_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "releases", element: (0, jsx_runtime_1.jsx)(ReleasesPage_1.default, { label: "buildit-deep" }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "artists", element: (0, jsx_runtime_1.jsx)(ArtistsPage_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "artists/:id", element: (0, jsx_runtime_1.jsx)(ArtistDetailPage_1.default, {}) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "playlists", element: (0, jsx_runtime_1.jsx)(PlaylistsPage_1.default, { label: "deep" }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "submit", element: (0, jsx_runtime_1.jsx)(SubmitPage_1.default, { label: "deep" }) }), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "legal", element: (0, jsx_runtime_1.jsx)(LegalPage_1.default, {}) })] }))] })), (0, jsx_runtime_1.jsx)(react_router_dom_1.Route, { path: "*", element: (0, jsx_runtime_1.jsx)(NotFoundPage_1.default, {}) })] })));
const App = () => {
    return ((0, jsx_runtime_1.jsxs)(material_1.ThemeProvider, Object.assign({ theme: theme_1.darkTheme }, { children: [(0, jsx_runtime_1.jsx)(material_1.CssBaseline, {}), (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { minHeight: '100vh', backgroundColor: 'background.default' } }, { children: (0, jsx_runtime_1.jsx)(react_router_dom_1.RouterProvider, { router: router, future: {
                        v7_startTransition: true,
                        v7_relativeSplatPath: true
                    } }) }))] })));
};
exports.default = App;
