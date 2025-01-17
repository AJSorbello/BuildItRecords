"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const isDevelopment = process.env.NODE_ENV === 'development';
// Create logs directory if it doesn't exist
const logDir = path_1.default.join(__dirname, '../../logs');
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir);
}
const winstonLogger = winston_1.default.createLogger({
    level: isDevelopment ? 'debug' : 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    transports: [
        // Write to all logs with level 'info' and below to 'app.log'
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'app.log'),
            maxsize: 5242880,
            maxFiles: 5,
        }),
        // Write all logs error (and below) to 'error.log'.
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
        })
    ]
});
// If we're in development, log to the console with colors
if (isDevelopment) {
    winstonLogger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
    }));
}
class Logger {
    constructor() {
        this.logger = winstonLogger;
    }
    info(message, ...args) {
        this.logger.info(message, ...args);
    }
    warn(message, ...args) {
        this.logger.warn(message, ...args);
    }
    error(message, ...args) {
        this.logger.error(message, ...args);
    }
    debug(message, ...args) {
        this.logger.debug(message, ...args);
    }
}
exports.logger = new Logger();
