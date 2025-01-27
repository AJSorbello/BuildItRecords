"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const ErrorMessage = ({ message }) => {
    return ((0, jsx_runtime_1.jsx)(material_1.Box, Object.assign({ mt: 2, mb: 2 }, { children: (0, jsx_runtime_1.jsx)(material_1.Alert, Object.assign({ severity: "error" }, { children: message })) })));
};
exports.default = ErrorMessage;
