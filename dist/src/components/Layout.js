"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Layout = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const material_1 = require("@mui/material");
const Menu_1 = __importDefault(require("@mui/icons-material/Menu"));
const react_router_dom_1 = require("react-router-dom");
const TopNavigation_1 = __importDefault(require("./TopNavigation"));
const DeepSidebar_1 = __importDefault(require("./DeepSidebar"));
const RecordsSidebar_1 = __importDefault(require("./RecordsSidebar"));
const TechSidebar_1 = __importDefault(require("./TechSidebar"));
const BuildItRecords_png_1 = __importDefault(require("../assets/png/records/BuildItRecords.png"));
const BuildIt_Tech_png_1 = __importDefault(require("../assets/png/tech/BuildIt_Tech.png"));
const BuildIt_Deep_png_1 = __importDefault(require("../assets/png/deep/BuildIt_Deep.png"));
const getLogo = (label) => {
    switch (label.toUpperCase()) {
        case 'TECH':
            return BuildIt_Tech_png_1.default;
        case 'DEEP':
            return BuildIt_Deep_png_1.default;
        default:
            return BuildItRecords_png_1.default;
    }
};
const Layout = () => {
    const location = (0, react_router_dom_1.useLocation)();
    const theme = (0, material_1.useTheme)();
    const isMobile = (0, material_1.useMediaQuery)('(max-width:900px)');
    const [mobileOpen, setMobileOpen] = react_1.default.useState(false);
    const path = location.pathname;
    const currentLabel = (path.split('/')[1] || 'records').toUpperCase();
    const isAdminRoute = path.startsWith('/admin');
    console.log('Layout rendered:', { path, currentLabel, isAdminRoute });
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };
    const renderSidebar = () => {
        if (isAdminRoute)
            return null;
        const drawerVariant = isMobile ? "temporary" : "permanent";
        const sidebarProps = {
            variant: drawerVariant,
            open: isMobile ? mobileOpen : true,
            onClose: handleDrawerToggle
        };
        switch (currentLabel) {
            case 'TECH':
                return (0, jsx_runtime_1.jsx)(TechSidebar_1.default, Object.assign({}, sidebarProps));
            case 'DEEP':
                return (0, jsx_runtime_1.jsx)(DeepSidebar_1.default, Object.assign({}, sidebarProps));
            default:
                return (0, jsx_runtime_1.jsx)(RecordsSidebar_1.default, Object.assign({}, sidebarProps));
        }
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: { display: 'flex', minHeight: '100vh' } }, { children: [(0, jsx_runtime_1.jsx)(material_1.CssBaseline, {}), !isAdminRoute && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [isMobile && ((0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ color: "inherit", "aria-label": "open drawer", edge: "start", onClick: handleDrawerToggle, sx: {
                            position: 'fixed',
                            top: '1rem',
                            left: '1rem',
                            zIndex: theme.zIndex.drawer + 2,
                            display: { sm: 'none' }
                        } }, { children: (0, jsx_runtime_1.jsx)(Menu_1.default, {}) }))), (0, jsx_runtime_1.jsx)(TopNavigation_1.default, { logo: getLogo(currentLabel) }), renderSidebar()] })), (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ component: "main", sx: {
                    flexGrow: 1,
                    width: { sm: isAdminRoute ? '100%' : `calc(100% - ${240}px)` },
                    ml: { sm: isAdminRoute ? 0 : `${240}px` },
                    mt: isAdminRoute ? 0 : '64px',
                    position: 'relative'
                } }, { children: (0, jsx_runtime_1.jsx)(react_router_dom_1.Outlet, {}) }))] })));
};
exports.Layout = Layout;
