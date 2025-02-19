'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('releases', 'images', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      });
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('releases', 'images');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
};
