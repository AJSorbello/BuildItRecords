"use strict";
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
module.exports = (sequelize, DataTypes) => {
    class Release extends Model {
        static associate(models) {
            // associations can be defined here
            Release.belongsTo(models.Label, {
                foreignKey: 'label_id',
                as: 'label'
            });
            Release.belongsToMany(models.Artist, {
                through: 'release_artists',
                foreignKey: 'release_id',
                otherKey: 'artist_id',
                as: 'artists'
            });
            Release.hasMany(models.Track, {
                foreignKey: 'release_id',
                as: 'tracks'
            });
        }
    }
    Release.init({
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true
        },
        release_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        artwork_url: {
            type: DataTypes.STRING
        },
        spotify_url: {
            type: DataTypes.STRING,
            validate: {
                isUrl: true
            }
        },
        spotify_uri: {
            type: DataTypes.STRING,
            validate: {
                isSpotifyUri(value) {
                    if (value && !value.startsWith('spotify:album:')) {
                        throw new Error('Invalid Spotify URI format');
                    }
                }
            }
        },
        label_id: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'labels',
                key: 'id'
            }
        },
        total_tracks: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('draft', 'scheduled', 'published'),
            allowNull: false,
            defaultValue: 'draft',
            validate: {
                isIn: [['draft', 'scheduled', 'published']]
            }
        }
    }, {
        sequelize,
        modelName: 'Release',
        tableName: 'releases',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['label_id']
            },
            {
                fields: ['release_date']
            },
            {
                fields: ['status']
            }
        ],
        hooks: {
            beforeValidate: (release) => {
                if (release.release_date && release.release_date instanceof Date) {
                    release.release_date = release.release_date.toISOString().split('T')[0];
                }
            }
        }
    });
    return Release;
};
