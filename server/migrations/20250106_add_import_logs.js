'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('import_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      label_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'labels',
          key: 'id'
        }
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('import_logs', ['label_id']);
    await queryInterface.addIndex('import_logs', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('import_logs');
  }
};
