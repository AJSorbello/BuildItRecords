'use strict';

module.exports = (sequelize, DataTypes) => {
  const ImportLog = sequelize.define('import_log', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: sequelize.literal('gen_random_uuid()')
    },
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
    tableName: 'import_logs',
    underscored: true,
    timestamps: true
  });

  ImportLog.associate = function(models) {
    ImportLog.belongsTo(models.Label, {
      foreignKey: 'label_id',
      as: 'label'
    });
  };

  return ImportLog;
};
