'use strict';
module.exports = (sequelize, DataTypes) => {
    const ReleaseArtist = sequelize.define('release_artist', {
        release_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'releases',
                key: 'id'
            }
        },
        artist_id: {
            type: DataTypes.UUID,
            allowNull: false,
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
        tableName: 'release_artists',
        underscored: true,
        timestamps: false
    });
    ReleaseArtist.associate = function (models) {
        // associations can be defined here
    };
    return ReleaseArtist;
};
