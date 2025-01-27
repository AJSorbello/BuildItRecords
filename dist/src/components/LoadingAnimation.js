"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const styled_components_1 = __importStar(require("styled-components"));
const spin = (0, styled_components_1.keyframes) `
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;
const wave = (0, styled_components_1.keyframes) `
  0%, 100% { transform: scaleY(0.5); }
  50% { transform: scaleY(1.5); }
`;
const Container = styled_components_1.default.div `
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
`;
const WaveContainer = styled_components_1.default.div `
  display: flex;
  align-items: center;
  gap: 3px;
  height: 40px;
`;
const Bar = styled_components_1.default.div `
  width: 3px;
  height: 20px;
  background-color: #007AFF;
  border-radius: 3px;
  animation: ${wave} 1.5s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
`;
const LoadingAnimation = () => {
    return ((0, jsx_runtime_1.jsx)(Container, { children: (0, jsx_runtime_1.jsx)(WaveContainer, { children: [...Array(5)].map((_, i) => ((0, jsx_runtime_1.jsx)(Bar, { delay: i * 0.15 }, i))) }) }));
};
exports.default = LoadingAnimation;
