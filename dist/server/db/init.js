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
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');
const seedDatabase = require('./seeds');
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Read and execute schema.sql
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            // Drop and recreate tables
            yield sequelize.query(schema);
            console.log('[Database] Schema initialized successfully');
            // Seed the database
            yield seedDatabase();
            console.log('[Database] Initial data seeded successfully');
            console.log('[Database] Connection established successfully');
        }
        catch (error) {
            console.error('[Database] Error initializing database:', error);
            throw error;
        }
    });
}
module.exports = initializeDatabase;
