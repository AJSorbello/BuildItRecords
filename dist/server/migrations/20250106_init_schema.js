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
        try {
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
            });
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
                image_url: {
                    type: Sequelize.STRING
                },
                label_id: {
                    type: Sequelize.STRING,
                    references: {
                        model: 'labels',
                        key: 'id'
                    },
                    onDelete: 'SET NULL',
                    onUpdate: 'CASCADE'
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                }
            });
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
                release_date: {
                    type: Sequelize.DATE,
                    allowNull: true
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
                status: {
                    type: Sequelize.ENUM('draft', 'scheduled', 'published'),
                    allowNull: false,
                    defaultValue: 'draft'
                },
                label_id: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    references: {
                        model: 'labels',
                        key: 'id'
                    },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                primary_artist_id: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    references: {
                        model: 'artists',
                        key: 'id'
                    },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                total_tracks: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                }
            });
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
                duration: {
                    type: Sequelize.INTEGER,
                    allowNull: false
                },
                track_number: {
                    type: Sequelize.INTEGER,
                    allowNull: true
                },
                disc_number: {
                    type: Sequelize.INTEGER,
                    allowNull: true
                },
                isrc: {
                    type: Sequelize.STRING,
                    allowNull: true
                },
                preview_url: {
                    type: Sequelize.STRING,
                    allowNull: true
                },
                spotify_url: {
                    type: Sequelize.STRING,
                    allowNull: true
                },
                spotify_uri: {
                    type: Sequelize.STRING,
                    allowNull: true
                },
                release_id: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    references: {
                        model: 'releases',
                        key: 'id'
                    },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                label_id: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    references: {
                        model: 'labels',
                        key: 'id'
                    },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                remixer_id: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    references: {
                        model: 'artists',
                        key: 'id'
                    },
                    onDelete: 'SET NULL',
                    onUpdate: 'CASCADE'
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                }
            });
            // Create join tables
            yield queryInterface.createTable('release_artists', {
                release_id: {
                    type: Sequelize.STRING,
                    primaryKey: true,
                    references: {
                        model: 'releases',
                        key: 'id'
                    },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                artist_id: {
                    type: Sequelize.STRING,
                    primaryKey: true,
                    references: {
                        model: 'artists',
                        key: 'id'
                    },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                }
            });
            yield queryInterface.createTable('track_artists', {
                track_id: {
                    type: Sequelize.STRING,
                    primaryKey: true,
                    references: {
                        model: 'tracks',
                        key: 'id'
                    },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                artist_id: {
                    type: Sequelize.STRING,
                    primaryKey: true,
                    references: {
                        model: 'artists',
                        key: 'id'
                    },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                }
            });
            // Create indexes
            yield queryInterface.addIndex('artists', ['name']);
            yield queryInterface.addIndex('releases', ['name']);
            yield queryInterface.addIndex('tracks', ['name']);
            yield queryInterface.addIndex('labels', ['slug']);
            return Promise.resolve();
        }
        catch (error) {
            return Promise.reject(error);
        }
    }),
    down: (queryInterface, Sequelize) => __awaiter(void 0, void 0, void 0, function* () {
        yield queryInterface.dropTable('track_artists');
        yield queryInterface.dropTable('release_artists');
        yield queryInterface.dropTable('tracks');
        yield queryInterface.dropTable('releases');
        yield queryInterface.dropTable('artists');
        yield queryInterface.dropTable('labels');
    })
};
