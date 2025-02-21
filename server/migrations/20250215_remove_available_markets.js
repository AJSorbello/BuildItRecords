'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if columns exist before trying to remove them
      const releasesColumns = await queryInterface.describeTable('releases');
      const tracksColumns = await queryInterface.describeTable('tracks');

      // Remove available_markets from releases if it exists
      if (releasesColumns.available_markets) {
        await queryInterface.removeColumn('releases', 'available_markets', { transaction });
      }
      
      // Remove available_markets from tracks if it exists
      if (tracksColumns.available_markets) {
        await queryInterface.removeColumn('tracks', 'available_markets', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add back available_markets to releases
      await queryInterface.addColumn('releases', 'available_markets', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: []
      }, { transaction });

      // Add back available_markets to tracks
      await queryInterface.addColumn('tracks', 'available_markets', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: []
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
