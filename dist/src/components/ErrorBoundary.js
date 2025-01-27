"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorBoundary = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Error Boundary component for handling runtime errors
 * @module ErrorBoundary
 */
const react_1 = require("react");
const material_1 = require("@mui/material");
const styles_1 = require("@mui/material/styles");
const ErrorContainer = (0, styles_1.styled)(material_1.Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: theme.spacing(3),
    backgroundColor: '#121212',
    color: '#FFFFFF',
}));
const ErrorButton = (0, styles_1.styled)(material_1.Button)(({ theme }) => ({
    marginTop: theme.spacing(2),
    backgroundColor: '#02FF95',
    color: '#121212',
    '&:hover': {
        backgroundColor: '#00CC76',
    },
}));
/**
 * Error Boundary component that catches JavaScript errors anywhere in the child
 * component tree and displays a fallback UI
 */
class ErrorBoundary extends react_1.Component {
    constructor() {
        super(...arguments);
        this.state = {
            hasError: false,
            error: null,
        };
        this.handleReset = () => {
            this.setState({ hasError: false, error: null });
            // Attempt to recover by trying to re-render the segment
            window.location.reload();
        };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        // Here you could send error reports to your error tracking service
    }
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return ((0, jsx_runtime_1.jsxs)(ErrorContainer, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "h4", gutterBottom: true }, { children: "Oops! Something went wrong" })), (0, jsx_runtime_1.jsx)(material_1.Typography, Object.assign({ variant: "body1", align: "center", sx: { maxWidth: 600, mb: 3 } }, { children: "We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists." })), (0, jsx_runtime_1.jsx)(ErrorButton, Object.assign({ variant: "contained", onClick: this.handleReset }, { children: "Try Again" }))] }));
        }
        return this.props.children;
    }
}
exports.ErrorBoundary = ErrorBoundary;
