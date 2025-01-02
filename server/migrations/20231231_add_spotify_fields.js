'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const addColumnIfNotExists = async (table, column, columnDefinition) => {
      try {
        await queryInterface.addColumn(table, column, columnDefinition);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`Column ${column} already exists in ${table}`);
        } else {
          throw error;
        }
      }
    };

    // Add fields to tracks table
    await addColumnIfNotExists('tracks', 'external_urls', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {}
    });

    await addColumnIfNotExists('tracks', 'external_ids', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {}
    });

    await addColumnIfNotExists('tracks', 'popularity', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // Add fields to releases table
    await addColumnIfNotExists('releases', 'images', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });

    await addColumnIfNotExists('releases', 'external_urls', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {}
    });

    await addColumnIfNotExists('releases', 'external_ids', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {}
    });

    await addColumnIfNotExists('releases', 'popularity', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await addColumnIfNotExists('releases', 'total_tracks', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await addColumnIfNotExists('releases', 'beatportUrl', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('releases', 'soundcloudUrl', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    const removeColumnIfExists = async (table, column) => {
      try {
        await queryInterface.removeColumn(table, column);
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`Column ${column} does not exist in ${table}`);
        } else {
          throw error;
        }
      }
    };

    // Remove fields from tracks table
    await removeColumnIfExists('tracks', 'external_urls');
    await removeColumnIfExists('tracks', 'external_ids');
    await removeColumnIfExists('tracks', 'popularity');

    // Remove fields from releases table
    await removeColumnIfExists('releases', 'images');
    await removeColumnIfExists('releases', 'external_urls');
    await removeColumnIfExists('releases', 'external_ids');
    await removeColumnIfExists('releases', 'popularity');
    await removeColumnIfExists('releases', 'total_tracks');
    await removeColumnIfExists('releases', 'beatportUrl');
    await removeColumnIfExists('releases', 'soundcloudUrl');
  }
};
