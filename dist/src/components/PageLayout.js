"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const material_1 = require("@mui/material");
const RecordsSidebar_1 = __importDefault(require("./RecordsSidebar"));
const TechSidebar_1 = __importDefault(require("./TechSidebar"));
const DeepSidebar_1 = __importDefault(require("./DeepSidebar"));
const Main = (0, material_1.styled)('main', {
    shouldForwardProp: (prop) => prop !== 'isMobile'
})(({ isMobile }) => ({
    flexGrow: 1,
    padding: 0,
    backgroundColor: '#121212',
    marginTop: '64px',
    marginLeft: isMobile ? 0 : '0px',
    width: isMobile ? '100%' : 'calc(100% - 0px)',
    position: 'relative',
    transition: 'margin-left 0.3s ease',
    boxSizing: 'border-box',
    minWidth: 0 // Prevent flex items from growing beyond their container
}));
const ContentWrapper = (0, material_1.styled)(material_1.Box)({
    display: 'flex',
    position: 'relative',
    backgroundColor: '#121212',
    width: '100%',
    minWidth: 0,
    overflow: 'hidden',
    boxSizing: 'border-box'
});
const getSidebar = (label, open, onClose, isMobile) => {
    const drawerVariant = isMobile ? "temporary" : "permanent";
    const sidebarProps = {
        variant: drawerVariant,
        open,
        onClose
    };
    switch (label) {
        case 'tech':
            return (0, jsx_runtime_1.jsx)(TechSidebar_1.default, Object.assign({}, sidebarProps));
        case 'deep':
            return (0, jsx_runtime_1.jsx)(DeepSidebar_1.default, Object.assign({}, sidebarProps));
        default:
            return (0, jsx_runtime_1.jsx)(RecordsSidebar_1.default, Object.assign({}, sidebarProps));
    }
};
const PageLayout = ({ children, label }) => {
    const theme = (0, material_1.useTheme)();
    const isMobile = (0, material_1.useMediaQuery)(theme.breakpoints.down('xl'));
    const [mobileOpen, setMobileOpen] = (0, react_1.useState)(false);
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ sx: {
            display: 'flex',
            width: '100%',
            minWidth: 0,
            overflow: 'hidden'
        } }, { children: [getSidebar(label, mobileOpen, handleDrawerToggle, isMobile), (0, jsx_runtime_1.jsx)(Main, Object.assign({ isMobile: isMobile }, { children: children }))] })));
};
exports.default = PageLayout;
