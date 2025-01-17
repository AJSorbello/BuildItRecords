"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_router_dom_1 = require("react-router-dom");
const material_1 = require("@mui/material");
const StyledTabs = (0, material_1.styled)(material_1.Tabs)(({ theme }) => ({
    '& .MuiTabs-indicator': {
        backgroundColor: theme.palette.primary.main,
    },
}));
const StyledTab = (0, material_1.styled)(material_1.Tab)(({ theme }) => ({
    color: theme.palette.text.primary,
    '&.Mui-selected': {
        color: theme.palette.primary.main,
    },
    '&:hover': {
        color: theme.palette.primary.main,
        opacity: 1,
    },
    minWidth: 120,
}));
const LogoImage = (0, material_1.styled)('img')({
    height: 40,
    marginRight: 16,
});
const Navigation = () => {
    const location = (0, react_router_dom_1.useLocation)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const getTabValue = () => {
        switch (location.pathname) {
            case '/':
                return 0;
            case '/tech':
                return 1;
            case '/deep':
                return 2;
            default:
                return 0;
        }
    };
    const handleTabChange = (_, newValue) => {
        switch (newValue) {
            case 0:
                navigate('/');
                break;
            case 1:
                navigate('/tech');
                break;
            case 2:
                navigate('/deep');
                break;
        }
    };
    return ((0, jsx_runtime_1.jsx)(material_1.AppBar, Object.assign({ position: "static", color: "transparent", elevation: 0 }, { children: (0, jsx_runtime_1.jsx)(material_1.Toolbar, { children: (0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ display: "flex", alignItems: "center", width: "100%" }, { children: (0, jsx_runtime_1.jsxs)(StyledTabs, Object.assign({ value: getTabValue(), onChange: handleTabChange, "aria-label": "label navigation tabs" }, { children: [(0, jsx_runtime_1.jsx)(StyledTab, { icon: (0, jsx_runtime_1.jsx)(LogoImage, { src: require('../assets/png/records/BuildIt_Records_Square.png') }), label: "Build It Records" }), (0, jsx_runtime_1.jsx)(StyledTab, { icon: (0, jsx_runtime_1.jsx)(LogoImage, { src: require('../assets/png/tech/BuildIt_Tech_Square.png') }), label: "Build It Tech" }), (0, jsx_runtime_1.jsx)(StyledTab, { icon: (0, jsx_runtime_1.jsx)(LogoImage, { src: require('../assets/png/deep/BuildIt_Deep_Square.png') }), label: "Build It Deep" })] })) })) }) })));
};
exports.default = Navigation;
