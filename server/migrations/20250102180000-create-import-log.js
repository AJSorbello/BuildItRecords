'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ImportLogs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      spotifyId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      importedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('ImportLogs', ['type', 'spotifyId']);
    await queryInterface.addIndex('ImportLogs', ['status']);
    await queryInterface.addIndex('ImportLogs', ['importedAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ImportLogs');
  }
};
