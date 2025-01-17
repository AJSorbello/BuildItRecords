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
const { pool } = require('../db');
const fs = require('fs');
const path = require('path');
function runMigration() {
    return __awaiter(this, void 0, void 0, function* () {
        const migrationFile = path.join(__dirname, '../migrations/20250106_update_artists_schema.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');
        try {
            yield pool.query('BEGIN');
            yield pool.query(sql);
            yield pool.query('COMMIT');
            console.log('Migration completed successfully');
        }
        catch (error) {
            yield pool.query('ROLLBACK');
            console.error('Error running migration:', error);
            process.exit(1);
        }
        finally {
            yield pool.end();
        }
    });
}
runMigration();
