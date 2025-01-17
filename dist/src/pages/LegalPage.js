"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const material_1 = require("@mui/material");
function TabPanel(props) {
    const { children, value, index } = props, other = __rest(props, ["children", "value", "index"]);
    return ((0, jsx_runtime_1.jsx)("div", Object.assign({ role: "tabpanel", hidden: value !== index, id: `legal-tabpanel-${index}`, "aria-labelledby": `legal-tab-${index}` }, other, { children: value === index && ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: { p: 3 } }, { children: children }))) })));
}
function a11yProps(index) {
    return {
        id: `legal-tab-${index}`,
        'aria-controls': `legal-tabpanel-${index}`,
    };
}
const LegalPage = () => {
    const [value, setValue] = react_1.default.useState(0);
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };
    return ((0, jsx_runtime_1.jsx)(material_1.Container, Object.assign({ maxWidth: "lg", sx: { mt: '80px', mb: 4 } }, { children: (0, jsx_runtime_1.jsxs)(material_1.Paper, Object.assign({ sx: {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                p: 2
            } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", component: "h1", gutterBottom: true, align: "center", sx: { mb: 4 } }, { children: "Legal Information" })), (0, jsx_runtime_1.jsxs)(material_1.Tabs, Object.assign({ value: value, onChange: handleChange, "aria-label": "legal information tabs", centered: true, sx: {
                        '& .MuiTab-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&.Mui-selected': {
                                color: '#02FF95',
                            },
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#02FF95',
                        },
                    } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Tab, Object.assign({ label: "Terms of Service" }, a11yProps(0))), (0, jsx_runtime_1.jsx)(material_1.Tab, Object.assign({ label: "Privacy Policy" }, a11yProps(1)))] })), (0, jsx_runtime_1.jsxs)(TabPanel, Object.assign({ value: value, index: 0 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true, sx: { color: '#02FF95' } }, { children: "Terms of Service" })), (0, jsx_runtime_1.jsxs)(material_1.List, { children: [(0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "1. Acceptance of Terms", secondary: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "text.secondary" }, { children: "By submitting music to Build It Records, you agree to be bound by these terms and conditions." })) }) }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { my: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' } }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "2. Submission Guidelines", secondary: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ component: "div", sx: { color: 'text.secondary' } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ paragraph: true }, { children: "All submissions must:" })), (0, jsx_runtime_1.jsxs)(material_1.List, { children: [(0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "\u2022 Be 100% original and royalty-free" }) }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "\u2022 Be previously unreleased material" }) }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "\u2022 Be submitted in WAV format without limiting on the master bus" }) }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "\u2022 Include only cleared samples (if any)" }) })] })] })) }) }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { my: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' } }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "3. Rights and Ownership", secondary: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "text.secondary" }, { children: "You retain the copyright to your music. By submitting, you grant Build It Records the right to review and potentially offer a contract for release. No rights are transferred until a separate agreement is signed." })) }) }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { my: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' } }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "4. Revenue Sharing", secondary: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "text.secondary" }, { children: "If your track is selected for release, royalties will be split 50/50 between the artist and label, as specified in the subsequent release agreement." })) }) }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { my: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' } }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "5. Response Time", secondary: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "text.secondary" }, { children: "We aim to respond to all submissions within 7 business days. Due to high volume, we cannot guarantee feedback on rejected submissions." })) }) })] })] })), (0, jsx_runtime_1.jsxs)(TabPanel, Object.assign({ value: value, index: 1 }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h5", gutterBottom: true, sx: { color: '#02FF95' } }, { children: "Privacy Policy" })), (0, jsx_runtime_1.jsxs)(material_1.List, { children: [(0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "1. Information We Collect", secondary: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ component: "div", sx: { color: 'text.secondary' } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ paragraph: true }, { children: "We collect the following information:" })), (0, jsx_runtime_1.jsxs)(material_1.List, { children: [(0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "\u2022 Full name and artist name" }) }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "\u2022 Email address" }) }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "\u2022 Country and province/state" }) }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "\u2022 Social media links" }) }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "\u2022 Music submissions and related metadata" }) })] })] })) }) }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { my: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' } }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "2. How We Use Your Information", secondary: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ component: "div", sx: { color: 'text.secondary' } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ paragraph: true }, { children: "Your information is used for:" })), (0, jsx_runtime_1.jsxs)(material_1.List, { children: [(0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "\u2022 Reviewing and processing submissions" }) }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "\u2022 Communication regarding your submission" }) }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "\u2022 Contract preparation if selected" }) })] })] })) }) }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { my: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' } }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "3. Data Protection", secondary: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "text.secondary" }, { children: "We implement appropriate security measures to protect your personal information. Your data is stored securely and is only accessible to authorized personnel." })) }) }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { my: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' } }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "4. Your Rights", secondary: (0, jsx_runtime_1.jsxs)(material_1.Box, Object.assign({ component: "div", sx: { color: 'text.secondary' } }, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ paragraph: true }, { children: "You have the right to:" })), (0, jsx_runtime_1.jsxs)(material_1.List, { children: [(0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "\u2022 Access your personal data" }) }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "\u2022 Request data correction" }) }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "\u2022 Request data deletion" }) })] })] })) }) }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { my: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' } }), (0, jsx_runtime_1.jsx)(material_1.ListItem, { children: (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "5. Contact Us", secondary: (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ color: "text.secondary" }, { children: "For any privacy-related concerns or requests, please contact us at aj@builditrecords.com" })) }) })] })] }))] })) })));
};
exports.default = LegalPage;
