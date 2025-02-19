'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('releases', 'type', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('releases', 'popularity', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('releases', 'type');
    await queryInterface.removeColumn('releases', 'popularity');
  }
};
