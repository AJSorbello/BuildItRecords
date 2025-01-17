"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const react_router_dom_1 = require("react-router-dom");
const theme_1 = require("../theme/theme");
const Home_1 = __importDefault(require("@mui/icons-material/Home"));
const Album_1 = __importDefault(require("@mui/icons-material/Album"));
const People_1 = __importDefault(require("@mui/icons-material/People"));
const QueueMusic_1 = __importDefault(require("@mui/icons-material/QueueMusic"));
const Send_1 = __importDefault(require("@mui/icons-material/Send"));
const Close_1 = __importDefault(require("@mui/icons-material/Close"));
const drawerWidth = 240;
const RecordsSidebar = ({ open = true, onClose, variant, sx }) => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const color = theme_1.labelColors.records;
    const menuItems = [
        { text: 'Home', icon: (0, jsx_runtime_1.jsx)(Home_1.default, {}), path: '/records' },
        { text: 'Releases', icon: (0, jsx_runtime_1.jsx)(Album_1.default, {}), path: '/records/releases' },
        { text: 'Artists', icon: (0, jsx_runtime_1.jsx)(People_1.default, {}), path: '/records/artists' },
        { text: 'Playlists', icon: (0, jsx_runtime_1.jsx)(QueueMusic_1.default, {}), path: '/records/playlists' },
        { text: 'Submit', icon: (0, jsx_runtime_1.jsx)(Send_1.default, {}), path: '/records/submit' },
    ];
    const handleItemClick = (path) => {
        navigate(path);
        if (variant === "temporary" && onClose) {
            onClose();
        }
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Drawer, Object.assign({ variant: variant, open: open, onClose: onClose, PaperProps: {
            sx: {
                border: 'none'
            }
        }, sx: Object.assign(Object.assign({}, sx), { width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
                backgroundColor: '#000000',
                marginTop: variant === 'temporary' ? 0 : '180px',
                border: 'none'
            } }) }, { children: [variant === 'temporary' && ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { display: 'flex', justifyContent: 'flex-end', p: 1 } }, { children: (0, jsx_runtime_1.jsx)(material_1.IconButton, Object.assign({ onClick: onClose, sx: { color: '#FFFFFF' } }, { children: (0, jsx_runtime_1.jsx)(Close_1.default, {}) })) }))), (0, jsx_runtime_1.jsx)(material_1.List, { children: menuItems.map((item) => ((0, jsx_runtime_1.jsxs)(material_1.ListItem, Object.assign({ button: true, onClick: () => handleItemClick(item.path), sx: {
                        color: '#FFFFFF',
                        height: '48px',
                        '&:hover': {
                            backgroundColor: 'rgba(2, 255, 149, 0.08)',
                        },
                        '& .MuiListItemIcon-root': {
                            minWidth: '40px',
                            marginLeft: '12px',
                        },
                        '& .MuiListItemText-primary': {
                            fontSize: '0.875rem',
                            fontWeight: 500,
                        },
                    } }, { children: [(0, jsx_runtime_1.jsx)(material_1.ListItemIcon, Object.assign({ sx: { color: color } }, { children: item.icon })), (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: item.text })] }), item.text))) })] })));
};
exports.default = RecordsSidebar;
