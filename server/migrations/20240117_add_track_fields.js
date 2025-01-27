'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Add external_urls column
      await queryInterface.addColumn('tracks', 'external_urls', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      }, { transaction });

      // Add type column
      await queryInterface.addColumn('tracks', 'type', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'track'
      }, { transaction });

      // Add explicit column
      await queryInterface.addColumn('tracks', 'explicit', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      }, { transaction });

      // Add popularity column
      await queryInterface.addColumn('tracks', 'popularity', {
        type: Sequelize.INTEGER,
        allowNull: true
      }, { transaction });

      // Add available_markets column
      await queryInterface.addColumn('tracks', 'available_markets', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: []
      }, { transaction });

      // Add is_local column
      await queryInterface.addColumn('tracks', 'is_local', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      }, { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('tracks', 'external_urls', { transaction });
      await queryInterface.removeColumn('tracks', 'type', { transaction });
      await queryInterface.removeColumn('tracks', 'explicit', { transaction });
      await queryInterface.removeColumn('tracks', 'popularity', { transaction });
      await queryInterface.removeColumn('tracks', 'available_markets', { transaction });
      await queryInterface.removeColumn('tracks', 'is_local', { transaction });
    });
  }
};
