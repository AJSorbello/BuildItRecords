"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabBarContainer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const ThemeContext_1 = require("../contexts/ThemeContext");
function TabBarContainer({ children }) {
    const { colors } = (0, ThemeContext_1.useTheme)();
    return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ sx: {
            flex: 1,
            backgroundColor: colors.background,
            boxShadow: `0px 2px 3.84px ${colors.shadow}25`,
        } }, { children: children })));
}
exports.TabBarContainer = TabBarContainer;
