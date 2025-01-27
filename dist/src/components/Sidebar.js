"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const react_router_dom_1 = require("react-router-dom");
const icons_material_1 = require("@mui/icons-material");
const drawerWidth = 240;
const StyledDrawer = (0, material_1.styled)(material_1.Drawer)(({ theme }) => ({
    width: drawerWidth,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
        width: drawerWidth,
        boxSizing: 'border-box',
        backgroundColor: '#121212',
        borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        marginTop: '180px',
        position: 'fixed',
        height: 'calc(100vh - 180px)',
    },
    '& .MuiDrawer-docked': {
        width: 0,
    },
}));
const StyledListButton = (0, material_1.styled)(material_1.ListItemButton)(({ active }) => ({
    marginBottom: '8px',
    borderRadius: '4px',
    backgroundColor: active ? 'rgba(2, 255, 149, 0.1)' : 'transparent',
    '&:hover': {
        backgroundColor: 'rgba(2, 255, 149, 0.1)',
    },
    '& .MuiListItemIcon-root': {
        color: active ? '#02FF95' : '#FFFFFF',
    },
    '& .MuiListItemText-primary': {
        color: active ? '#02FF95' : '#FFFFFF',
    },
}));
const Sidebar = ({ label }) => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const location = (0, react_router_dom_1.useLocation)();
    const menuItems = [
        { text: 'Home', icon: (0, jsx_runtime_1.jsx)(icons_material_1.Home, {}), path: `/${label === 'records' ? '' : label}` },
        { text: 'Artists', icon: (0, jsx_runtime_1.jsx)(icons_material_1.Person, {}), path: `/${label}/artists` },
        { text: 'Releases', icon: (0, jsx_runtime_1.jsx)(icons_material_1.Album, {}), path: `/${label}/releases` },
        { text: 'Playlists', icon: (0, jsx_runtime_1.jsx)(icons_material_1.PlaylistPlay, {}), path: `/${label}/playlists` },
        { text: 'Submit Demo', icon: (0, jsx_runtime_1.jsx)(icons_material_1.Send, {}), path: `/${label}/submit` },
    ];
    return ((0, jsx_runtime_1.jsx)(StyledDrawer, Object.assign({ variant: "permanent", anchor: "left" }, { children: (0, jsx_runtime_1.jsx)(material_1.List, { children: menuItems.map((item) => ((0, jsx_runtime_1.jsxs)(StyledListButton, Object.assign({ onClick: () => navigate(item.path), active: location.pathname === item.path }, { children: [(0, jsx_runtime_1.jsx)(material_1.ListItemIcon, { children: item.icon }), (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: item.text })] }), item.text))) }) })));
};
exports.default = Sidebar;
