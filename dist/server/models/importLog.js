'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ImportLog extends Model {
        static associate(models) {
            ImportLog.belongsTo(models.Label, {
                foreignKey: 'label_id',
                as: 'label'
            });
        }
    }
    ImportLog.init({
        label_id: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'labels',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [['started', 'completed', 'failed']]
            }
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        completed_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'ImportLog',
        tableName: 'import_logs',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                fields: ['label_id']
            },
            {
                fields: ['status']
            },
            {
                fields: ['completed_at']
            }
        ]
    });
    return ImportLog;
};
