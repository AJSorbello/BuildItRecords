'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
module.exports = {
    up: (queryInterface, Sequelize) => __awaiter(void 0, void 0, void 0, function* () {
        yield queryInterface.sequelize.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
            // Create labels table
            yield queryInterface.createTable('labels', {
                id: {
                    type: Sequelize.STRING,
                    primaryKey: true,
                    allowNull: false
                },
                name: {
                    type: Sequelize.STRING,
                    allowNull: false
                },
                display_name: {
                    type: Sequelize.STRING,
                    allowNull: false
                },
                slug: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    unique: true
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                }
            }, { transaction });
            // Create artists table
            yield queryInterface.createTable('artists', {
                id: {
                    type: Sequelize.STRING,
                    primaryKey: true,
                    allowNull: false
                },
                name: {
                    type: Sequelize.STRING,
                    allowNull: false
                },
                spotify_url: {
                    type: Sequelize.STRING
                },
                spotify_uri: {
                    type: Sequelize.STRING
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                }
            }, { transaction });
            // Create releases table
            yield queryInterface.createTable('releases', {
                id: {
                    type: Sequelize.STRING,
                    primaryKey: true,
                    allowNull: false
                },
                name: {
                    type: Sequelize.STRING,
                    allowNull: false
                },
                label_id: {
                    type: Sequelize.STRING,
                    references: {
                        model: 'labels',
                        key: 'id'
                    },
                    allowNull: false
                },
                release_date: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                artwork_url: {
                    type: Sequelize.STRING
                },
                spotify_url: {
                    type: Sequelize.STRING
                },
                spotify_uri: {
                    type: Sequelize.STRING
                },
                total_tracks: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0
                },
                status: {
                    type: Sequelize.ENUM('draft', 'scheduled', 'published'),
                    allowNull: false,
                    defaultValue: 'draft'
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                }
            }, { transaction });
            // Create tracks table
            yield queryInterface.createTable('tracks', {
                id: {
                    type: Sequelize.STRING,
                    primaryKey: true,
                    allowNull: false
                },
                name: {
                    type: Sequelize.STRING,
                    allowNull: false
                },
                release_id: {
                    type: Sequelize.STRING,
                    references: {
                        model: 'releases',
                        key: 'id'
                    },
                    allowNull: false
                },
                duration: {
                    type: Sequelize.INTEGER
                },
                track_number: {
                    type: Sequelize.INTEGER
                },
                preview_url: {
                    type: Sequelize.STRING
                },
                spotify_url: {
                    type: Sequelize.STRING
                },
                spotify_uri: {
                    type: Sequelize.STRING
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                }
            }, { transaction });
            // Create track_artists table
            yield queryInterface.createTable('track_artists', {
                track_id: {
                    type: Sequelize.STRING,
                    primaryKey: true,
                    references: {
                        model: 'tracks',
                        key: 'id'
                    },
                    allowNull: false
                },
                artist_id: {
                    type: Sequelize.STRING,
                    primaryKey: true,
                    references: {
                        model: 'artists',
                        key: 'id'
                    },
                    allowNull: false
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                }
            }, { transaction });
            // Create release_artists table with role field
            yield queryInterface.createTable('release_artists', {
                release_id: {
                    type: Sequelize.STRING,
                    primaryKey: true,
                    references: {
                        model: 'releases',
                        key: 'id'
                    },
                    allowNull: false
                },
                artist_id: {
                    type: Sequelize.STRING,
                    primaryKey: true,
                    references: {
                        model: 'artists',
                        key: 'id'
                    },
                    allowNull: false
                },
                role: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    defaultValue: 'primary'
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                }
            }, { transaction });
            // Add indexes
            yield queryInterface.addIndex('releases', ['label_id'], { transaction });
            yield queryInterface.addIndex('releases', ['release_date'], { transaction });
            yield queryInterface.addIndex('tracks', ['release_id'], { transaction });
            yield queryInterface.addIndex('track_artists', ['track_id'], { transaction });
            yield queryInterface.addIndex('track_artists', ['artist_id'], { transaction });
            yield queryInterface.addIndex('release_artists', ['release_id'], { transaction });
            yield queryInterface.addIndex('release_artists', ['artist_id'], { transaction });
        }));
    }),
    down: (queryInterface, Sequelize) => __awaiter(void 0, void 0, void 0, function* () {
        yield queryInterface.sequelize.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
            yield queryInterface.dropTable('track_artists', { transaction });
            yield queryInterface.dropTable('release_artists', { transaction });
            yield queryInterface.dropTable('tracks', { transaction });
            yield queryInterface.dropTable('releases', { transaction });
            yield queryInterface.dropTable('artists', { transaction });
            yield queryInterface.dropTable('labels', { transaction });
        }));
    })
};
