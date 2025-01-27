'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class TrackArtist extends Model {
        static associate(models) {
            // associations can be defined here
            TrackArtist.belongsTo(models.Track, {
                foreignKey: 'track_id',
                as: 'track'
            });
            TrackArtist.belongsTo(models.Artist, {
                foreignKey: 'artist_id',
                as: 'artist'
            });
        }
    }
    TrackArtist.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        track_id: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'tracks',
                key: 'id'
            }
        },
        artist_id: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'artists',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'TrackArtist',
        tableName: 'track_artists',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    return TrackArtist;
};
