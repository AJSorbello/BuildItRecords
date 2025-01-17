"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.closeConnection = exports.initializeDatabase = exports.createConnection = void 0;
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let sequelize = null;
const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
        } : false,
        connectTimeout: 60000
    },
    define: {
        underscored: true,
        underscoredAll: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    retry: {
        max: 3,
        match: [
            /SequelizeConnectionError/,
            /SequelizeConnectionRefusedError/,
            /SequelizeHostNotFoundError/,
            /SequelizeHostNotReachableError/,
            /SequelizeInvalidConnectionError/,
            /SequelizeConnectionTimedOutError/
        ]
    }
};
const createConnection = () => {
    if (sequelize)
        return sequelize;
    sequelize = new sequelize_1.Sequelize(process.env.DB_NAME || 'builditrecords', process.env.DB_USER || 'postgres', process.env.DB_PASSWORD || 'postgres', config);
    return sequelize;
};
exports.createConnection = createConnection;
const initializeDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = (0, exports.createConnection)();
        yield db.authenticate();
        console.log('Database connection established successfully.');
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
});
exports.initializeDatabase = initializeDatabase;
const closeConnection = () => __awaiter(void 0, void 0, void 0, function* () {
    if (sequelize) {
        try {
            yield sequelize.close();
            console.log('Database connection closed.');
        }
        catch (error) {
            console.error('Error closing database connection:', error);
            throw error;
        }
    }
});
exports.closeConnection = closeConnection;
const query = (text, params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = (0, exports.createConnection)();
        const [results] = yield db.query(text, {
            replacements: params,
            type: db.QueryTypes.SELECT
        });
        return { rows: results };
    }
    catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
});
exports.query = query;
// Handle process termination gracefully
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.closeConnection)();
    process.exit(0);
}));
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.closeConnection)();
    process.exit(0);
}));
exports.default = {
    createConnection: exports.createConnection,
    initializeDatabase: exports.initializeDatabase,
    closeConnection: exports.closeConnection,
    query: exports.query
};
