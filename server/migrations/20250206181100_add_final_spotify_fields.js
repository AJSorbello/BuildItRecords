'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Add remaining fields to artists table
      await queryInterface.addColumn('artists', 'popularity', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      }, { transaction });

      await queryInterface.addColumn('artists', 'genres', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: []
      }, { transaction });

      await queryInterface.addColumn('artists', 'followers_count', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      }, { transaction });

      await queryInterface.addColumn('artists', 'external_urls', {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Stores URLs from various platforms',
        defaultValue: {}
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove artist fields
      await queryInterface.removeColumn('artists', 'popularity', { transaction });
      await queryInterface.removeColumn('artists', 'genres', { transaction });
      await queryInterface.removeColumn('artists', 'followers_count', { transaction });
      await queryInterface.removeColumn('artists', 'external_urls', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
