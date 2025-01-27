"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
const Layout_1 = require("../components/Layout");
const AdminLayout_1 = __importDefault(require("../components/admin/AdminLayout"));
const RecordsHome_1 = __importDefault(require("../pages/labels/RecordsHome"));
const TechHome_1 = __importDefault(require("../pages/labels/TechHome"));
const DeepHome_1 = __importDefault(require("../pages/labels/DeepHome"));
const ReleasesPage_1 = __importDefault(require("../pages/ReleasesPage"));
const ArtistsPage_1 = __importDefault(require("../pages/ArtistsPage"));
const PlaylistsPage_1 = __importDefault(require("../pages/PlaylistsPage"));
const SubmitPage_1 = __importDefault(require("../pages/SubmitPage"));
const NotFoundPage_1 = __importDefault(require("../pages/NotFoundPage"));
const LegalPage_1 = __importDefault(require("../pages/LegalPage"));
const AdminLogin_1 = __importDefault(require("../pages/admin/AdminLogin"));
const AdminDashboard_1 = __importDefault(require("../pages/admin/AdminDashboard"));
const ArtistDetailPage_1 = __importDefault(require("../pages/ArtistDetailPage"));
const labels_1 = require("../constants/labels");
// Protected Route component
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        return (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/admin/login", replace: true });
    }
    return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children });
};
// Router configuration
exports.router = (0, react_router_dom_1.createBrowserRouter)([
    {
        path: '/',
        element: (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/records", replace: true }),
    },
    {
        path: '/records',
        element: (0, jsx_runtime_1.jsx)(Layout_1.Layout, {}),
        children: [
            {
                index: true,
                element: (0, jsx_runtime_1.jsx)(RecordsHome_1.default, {}),
            },
            {
                path: 'releases',
                element: (0, jsx_runtime_1.jsx)(ReleasesPage_1.default, { label: labels_1.RECORD_LABELS.RECORDS }),
            },
            {
                path: 'artists',
                element: (0, jsx_runtime_1.jsx)(ArtistsPage_1.default, {}),
            },
            {
                path: 'artists/:id',
                element: (0, jsx_runtime_1.jsx)(ArtistDetailPage_1.default, {}),
            },
            {
                path: 'playlists',
                element: (0, jsx_runtime_1.jsx)(PlaylistsPage_1.default, {}),
            },
            {
                path: 'submit',
                element: (0, jsx_runtime_1.jsx)(SubmitPage_1.default, {}),
            },
            {
                path: 'legal',
                element: (0, jsx_runtime_1.jsx)(LegalPage_1.default, {}),
            }
        ],
    },
    {
        path: '/deep',
        element: (0, jsx_runtime_1.jsx)(Layout_1.Layout, {}),
        children: [
            {
                index: true,
                element: (0, jsx_runtime_1.jsx)(DeepHome_1.default, {}),
            },
            {
                path: 'releases',
                element: (0, jsx_runtime_1.jsx)(ReleasesPage_1.default, { label: labels_1.RECORD_LABELS.DEEP }),
            },
            {
                path: 'artists',
                element: (0, jsx_runtime_1.jsx)(ArtistsPage_1.default, {}),
            },
            {
                path: 'artists/:id',
                element: (0, jsx_runtime_1.jsx)(ArtistDetailPage_1.default, {}),
            },
            {
                path: 'playlists',
                element: (0, jsx_runtime_1.jsx)(PlaylistsPage_1.default, {}),
            }
        ],
    },
    {
        path: '/tech',
        element: (0, jsx_runtime_1.jsx)(Layout_1.Layout, {}),
        children: [
            {
                index: true,
                element: (0, jsx_runtime_1.jsx)(TechHome_1.default, {}),
            },
            {
                path: 'releases',
                element: (0, jsx_runtime_1.jsx)(ReleasesPage_1.default, { label: labels_1.RECORD_LABELS.TECH }),
            },
            {
                path: 'artists',
                element: (0, jsx_runtime_1.jsx)(ArtistsPage_1.default, {}),
            },
            {
                path: 'artists/:id',
                element: (0, jsx_runtime_1.jsx)(ArtistDetailPage_1.default, {}),
            },
            {
                path: 'playlists',
                element: (0, jsx_runtime_1.jsx)(PlaylistsPage_1.default, {}),
            }
        ],
    },
    {
        path: '/admin',
        element: (0, jsx_runtime_1.jsx)(AdminLayout_1.default, {}),
        children: [
            {
                path: 'login',
                element: (0, jsx_runtime_1.jsx)(AdminLogin_1.default, {}),
            },
            {
                path: 'dashboard',
                element: (0, jsx_runtime_1.jsx)(ProtectedRoute, { children: (0, jsx_runtime_1.jsx)(AdminDashboard_1.default, {}) }),
            }
        ],
    },
    {
        path: '*',
        element: (0, jsx_runtime_1.jsx)(NotFoundPage_1.default, {}),
    }
]);
exports.default = exports.router;
