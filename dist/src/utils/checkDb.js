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
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../db");
function checkDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Check labels
            console.log('\nChecking labels table:');
            const labels = yield db_1.pool.query('SELECT * FROM labels');
            console.log(`Found ${labels.rows.length} labels:`, labels.rows);
            // Check albums
            console.log('\nChecking albums table:');
            const albums = yield db_1.pool.query('SELECT * FROM albums');
            console.log(`Found ${albums.rows.length} albums:`, albums.rows);
            // Check artists
            console.log('\nChecking artists table:');
            const artists = yield db_1.pool.query('SELECT * FROM artists');
            console.log(`Found ${artists.rows.length} artists:`, artists.rows);
            // Check tracks
            console.log('\nChecking tracks table:');
            const tracks = yield db_1.pool.query('SELECT * FROM tracks');
            console.log(`Found ${tracks.rows.length} tracks:`, tracks.rows);
            // Check artist_labels
            console.log('\nChecking artist_labels table:');
            const artistLabels = yield db_1.pool.query('SELECT * FROM artist_labels');
            console.log(`Found ${artistLabels.rows.length} artist-label relationships:`, artistLabels.rows);
            process.exit(0);
        }
        catch (error) {
            console.error('Error checking database:', error);
            process.exit(1);
        }
    });
}
checkDatabase();
