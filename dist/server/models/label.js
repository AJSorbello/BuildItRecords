"use strict";
const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
    class Label extends Model {
        static associate(models) {
            Label.hasMany(models.Artist, {
                foreignKey: 'label_id',
                as: 'artists'
            });
            Label.hasMany(models.Release, {
                foreignKey: 'label_id',
                as: 'releases'
            });
            Label.hasMany(models.Track, {
                foreignKey: 'label_id',
                as: 'tracks'
            });
            Label.hasMany(models.ImportLog, {
                foreignKey: 'label_id',
                as: 'importLogs'
            });
        }
    }
    Label.init({
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
        display_name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        spotifyPlaylistId: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'spotify_playlist_id'
        }
    }, {
        sequelize,
        modelName: 'Label',
        tableName: 'labels',
        underscored: true,
        timestamps: true
    });
    return Label;
};
