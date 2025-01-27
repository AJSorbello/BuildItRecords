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
const { Sequelize } = require('sequelize');
require('dotenv').config();
let sequelize = null;
const createConnection = () => {
    if (sequelize)
        return sequelize;
    sequelize = new Sequelize(process.env.DB_NAME || 'builditrecords', process.env.DB_USER || 'postgres', process.env.DB_PASSWORD || 'postgres', {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
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
    });
    // Handle connection events
    sequelize.addHook('beforeConnect', (config) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('[Database] Attempting to connect to database...');
    }));
    sequelize.addHook('afterConnect', (connection) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('[Database] Successfully connected to database');
    }));
    return sequelize;
};
const initializeDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sequelize = createConnection();
        // Test the connection
        yield sequelize.authenticate();
        console.log('[Database] Connection has been established successfully.');
        // Only sync in development
        if (process.env.NODE_ENV === 'development') {
            try {
                // Initialize models
                const models = require('../models');
                // Force sync to recreate tables
                yield sequelize.sync({ force: true });
                console.log('[Database] Database schema synchronized successfully');
                // Always seed in development after force sync
                console.log('[Database] Seeding initial data...');
                const { seedLabels } = require('../seeders/labelSeeder');
                const { seedReleases } = require('../seeders/releaseSeeder');
                yield seedLabels();
                yield seedReleases();
                console.log('[Database] Initial data seeded successfully');
            }
            catch (syncError) {
                console.error('[Database] Error syncing database:', syncError);
                throw syncError;
            }
        }
        return sequelize;
    }
    catch (error) {
        console.error('[Database] Unable to connect to the database:', error);
        // Implement exponential backoff for retries
        if (error.name === 'SequelizeConnectionError') {
            console.log('[Database] Attempting to reconnect...');
            for (let i = 0; i < 3; i++) {
                try {
                    yield new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                    const sequelize = createConnection();
                    yield sequelize.authenticate();
                    console.log('[Database] Reconnection successful');
                    return sequelize;
                }
                catch (retryError) {
                    console.error(`[Database] Reconnection attempt ${i + 1} failed:`, retryError);
                }
            }
        }
        throw error;
    }
});
// Handle process termination gracefully
const closeConnection = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!sequelize)
        return;
    try {
        // Wait for pending queries to complete (5 seconds max)
        yield Promise.race([
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for queries')), 5000)),
            sequelize.close()
        ]);
        console.log('[Database] Connection closed gracefully.');
    }
    catch (error) {
        console.error('[Database] Error closing connection:', error);
    }
    finally {
        sequelize = null;
    }
});
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    yield closeConnection();
    process.exit(0);
}));
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    yield closeConnection();
    process.exit(0);
}));
// Export a function to get the connection
module.exports = {
    getConnection: createConnection,
    initializeDatabase,
    closeConnection
};
