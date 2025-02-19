'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tracks', 'type', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'track'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('tracks', 'type');
  }
};
