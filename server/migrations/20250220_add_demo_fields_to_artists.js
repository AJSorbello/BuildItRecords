'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('artists', 'email', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('artists', 'country', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('artists', 'province', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('artists', 'facebook_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('artists', 'twitter_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('artists', 'instagram_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('artists', 'soundcloud_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('artists', 'apple_music_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('artists', 'full_name', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('artists', 'email');
    await queryInterface.removeColumn('artists', 'country');
    await queryInterface.removeColumn('artists', 'province');
    await queryInterface.removeColumn('artists', 'facebook_url');
    await queryInterface.removeColumn('artists', 'twitter_url');
    await queryInterface.removeColumn('artists', 'instagram_url');
    await queryInterface.removeColumn('artists', 'soundcloud_url');
    await queryInterface.removeColumn('artists', 'apple_music_url');
    await queryInterface.removeColumn('artists', 'full_name');
  }
};
