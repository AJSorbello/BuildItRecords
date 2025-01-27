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
const { sequelize } = require('../models');
const { Label, Artist, Release, Track } = require('../models');
function seedDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('[Seeder] Starting database seed...');
            // Create labels
            const labels = yield Label.bulkCreate([
                {
                    id: 'buildit-records',
                    name: 'Build It Records',
                    display_name: 'Build It Records',
                    slug: 'buildit-records'
                },
                {
                    id: 'buildit-tech',
                    name: 'Build It Tech',
                    display_name: 'Build It Tech',
                    slug: 'buildit-tech'
                },
                {
                    id: 'buildit-deep',
                    name: 'Build It Deep',
                    display_name: 'Build It Deep',
                    slug: 'buildit-deep'
                }
            ], { ignoreDuplicates: true });
            console.log('[Seeder] Labels seeded successfully');
            // Create artists
            const artists = yield Artist.bulkCreate([
                {
                    id: 'artist-1',
                    name: 'Artist One',
                    bio: 'Bio for Artist One',
                    labelId: 'buildit-records'
                },
                {
                    id: 'artist-2',
                    name: 'Artist Two',
                    bio: 'Bio for Artist Two',
                    labelId: 'buildit-tech'
                },
                {
                    id: 'artist-3',
                    name: 'Artist Three',
                    bio: 'Bio for Artist Three',
                    labelId: 'buildit-deep'
                }
            ], { ignoreDuplicates: true });
            console.log('[Seeder] Artists seeded successfully');
            // Create releases
            const releases = yield Release.bulkCreate([
                {
                    id: 'release-1',
                    title: 'Release One',
                    releaseDate: new Date(),
                    labelId: 'buildit-records',
                    type: 'single',
                    status: 'draft'
                },
                {
                    id: 'release-2',
                    title: 'Release Two',
                    releaseDate: new Date(),
                    labelId: 'buildit-tech',
                    type: 'single',
                    status: 'draft'
                },
                {
                    id: 'release-3',
                    title: 'Release Three',
                    releaseDate: new Date(),
                    labelId: 'buildit-deep',
                    type: 'single',
                    status: 'draft'
                }
            ], { ignoreDuplicates: true });
            console.log('[Seeder] Releases seeded successfully');
            // Create tracks
            const tracks = yield Track.bulkCreate([
                {
                    id: 'track-1',
                    name: 'Track One',
                    duration: 180000,
                    trackNumber: 1,
                    discNumber: 1,
                    releaseId: 'release-1',
                    labelId: 'buildit-records'
                },
                {
                    id: 'track-2',
                    name: 'Track Two',
                    duration: 200000,
                    trackNumber: 1,
                    discNumber: 1,
                    releaseId: 'release-2',
                    labelId: 'buildit-tech'
                },
                {
                    id: 'track-3',
                    name: 'Track Three',
                    duration: 220000,
                    trackNumber: 1,
                    discNumber: 1,
                    releaseId: 'release-3',
                    labelId: 'buildit-deep'
                }
            ], { ignoreDuplicates: true });
            console.log('[Seeder] Tracks seeded successfully');
            // Create track-artist associations
            yield sequelize.query(`
      INSERT INTO track_artists (track_id, artist_id, role)
      VALUES
        ('track-1', 'artist-1', 'primary'),
        ('track-2', 'artist-2', 'primary'),
        ('track-3', 'artist-3', 'primary')
      ON CONFLICT DO NOTHING;
    `);
            console.log('[Seeder] Track-Artist associations seeded successfully');
            // Create release-artist associations
            yield sequelize.query(`
      INSERT INTO release_artists (release_id, artist_id, role)
      VALUES
        ('release-1', 'artist-1', 'primary'),
        ('release-2', 'artist-2', 'primary'),
        ('release-3', 'artist-3', 'primary')
      ON CONFLICT DO NOTHING;
    `);
            console.log('[Seeder] Release-Artist associations seeded successfully');
            console.log('[Seeder] Database seeded successfully');
        }
        catch (error) {
            console.error('[Seeder] Error seeding database:', error);
            throw error;
        }
    });
}
module.exports = seedDatabase;
