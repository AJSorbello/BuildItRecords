'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Add spotify_uri column
      await queryInterface.addColumn('tracks', 'spotify_uri', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      // Add explicit column
      await queryInterface.addColumn('tracks', 'explicit', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
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
        allowNull: true
      }, { transaction });

      // Add is_local column
      await queryInterface.addColumn('tracks', 'is_local', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }, { transaction });

      // Add images column
      await queryInterface.addColumn('tracks', 'images', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('tracks', 'spotify_uri', { transaction });
      await queryInterface.removeColumn('tracks', 'explicit', { transaction });
      await queryInterface.removeColumn('tracks', 'popularity', { transaction });
      await queryInterface.removeColumn('tracks', 'available_markets', { transaction });
      await queryInterface.removeColumn('tracks', 'is_local', { transaction });
      await queryInterface.removeColumn('tracks', 'images', { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
