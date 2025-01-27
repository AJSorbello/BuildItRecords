'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ReleaseArtist extends Model {
        static associate(models) {
            // associations can be defined here
        }
    }
    ReleaseArtist.init({
        release_id: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'releases',
                key: 'id'
            }
        },
        artist_id: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'artists',
                key: 'id'
            }
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'primary',
            validate: {
                isIn: [['primary', 'featured', 'remixer']]
            }
        }
    }, {
        sequelize,
        modelName: 'ReleaseArtist',
        tableName: 'release_artists',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['release_id']
            },
            {
                fields: ['artist_id']
            },
            {
                fields: ['role']
            }
        ]
    });
    return ReleaseArtist;
};
