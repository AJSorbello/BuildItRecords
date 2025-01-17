"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const react_router_dom_1 = require("react-router-dom");
const BuildIt_Records_Square_png_1 = __importDefault(require("../assets/png/records/BuildIt_Records_Square.png"));
const BuildIt_Tech_Square_png_1 = __importDefault(require("../assets/png/tech/BuildIt_Tech_Square.png"));
const BuildIt_Deep_Square_png_1 = __importDefault(require("../assets/png/deep/BuildIt_Deep_Square.png"));
const StyledAppBar = (0, material_1.styled)(material_1.AppBar)(({ theme }) => ({
    background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.5) 100%)',
    boxShadow: 'none',
    borderBottom: 'none',
    height: '64px',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1300,
    display: 'flex',
    alignItems: 'center',
    '& .MuiToolbar-root': {
        background: 'transparent'
    }
}));
const StyledTabs = (0, material_1.styled)(material_1.Tabs)({
    width: '100%',
    height: '64px',
    backgroundColor: 'transparent',
    '& .MuiTabs-indicator': {
        backgroundColor: '#02FF95',
    },
    '& .MuiTabs-flexContainer': {
        justifyContent: 'space-between',
        height: '100%',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
});
const StyledTab = (0, material_1.styled)(material_1.Tab)(({ tabtype }) => ({
    flex: 1,
    maxWidth: 'none',
    color: '#FFFFFF',
    height: '64px',
    padding: 0,
    textTransform: 'none',
    fontSize: '14px',
    fontWeight: 500,
    '&.Mui-selected': {
        color: '#FFFFFF',
    },
    '&:hover': {
        color: tabtype === 'records' ? '#02FF95' :
            tabtype === 'tech' ? '#FF0000' :
                '#00BFFF',
        opacity: 1,
    },
}));
const Logo = (0, material_1.styled)('img')(({ tabtype }) => ({
    width: '32px',
    height: '32px',
    filter: 'brightness(0) invert(1)',
    transition: 'all 0.3s ease',
    '.MuiTab-root:hover &': {
        filter: tabtype === 'records' ? 'brightness(0) invert(0.9) sepia(1) saturate(5) hue-rotate(70deg)' :
            tabtype === 'tech' ? 'brightness(0) invert(0.2) sepia(1) saturate(10000%) hue-rotate(0deg)' :
                'brightness(0) invert(0.75) sepia(1) saturate(5000%) hue-rotate(175deg)',
    },
    marginBottom: '2px',
}));
const TabContent = (0, material_1.styled)(material_1.Box)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '2px',
});
const TopNavigation = () => {
    const location = (0, react_router_dom_1.useLocation)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const theme = (0, material_1.useTheme)();
    const isMobile = (0, material_1.useMediaQuery)('(max-width:900px)');
    const handleChange = (event, newValue) => {
        navigate(`/${newValue}`);
    };
    // Extract the label from the current path
    const currentLabel = location.pathname.split('/')[1] || 'records';
    const tabs = [
        {
            value: 'records',
            logo: BuildIt_Records_Square_png_1.default,
            label: 'Records'
        },
        {
            value: 'tech',
            logo: BuildIt_Tech_Square_png_1.default,
            label: 'Tech'
        },
        {
            value: 'deep',
            logo: BuildIt_Deep_Square_png_1.default,
            label: 'Deep'
        }
    ];
    return ((0, jsx_runtime_1.jsx)(StyledAppBar, { children: (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: {
                width: '100%',
                background: 'transparent',
                pl: isMobile ? '48px' : 0 // Add padding when mobile to account for hamburger menu
            } }, { children: (0, jsx_runtime_1.jsx)(StyledTabs, Object.assign({ sx: { background: 'transparent' }, value: currentLabel, onChange: handleChange, "aria-label": "label navigation", TabIndicatorProps: {
                    style: {
                        backgroundColor: currentLabel === 'records' ? '#02FF95' :
                            currentLabel === 'tech' ? '#FF0000' :
                                '#00BFFF'
                    }
                } }, { children: tabs.map((tab) => ((0, jsx_runtime_1.jsx)(StyledTab, { value: tab.value, tabtype: tab.value, label: (0, jsx_runtime_1.jsxs)(TabContent, { children: [(0, jsx_runtime_1.jsx)(Logo, { src: tab.logo, alt: tab.label, tabtype: tab.value }), (0, jsx_runtime_1.jsx)("span", { children: tab.label })] }) }, tab.value))) })) })) }));
};
exports.default = TopNavigation;
