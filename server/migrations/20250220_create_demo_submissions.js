'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('demo_submissions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      artist_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      full_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      country: {
        type: Sequelize.STRING,
        allowNull: false
      },
      province: {
        type: Sequelize.STRING,
        allowNull: true
      },
      facebook_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      twitter_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      instagram_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      soundcloud_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      apple_music_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      track_title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      track_url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      genre: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'reviewed', 'accepted', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('demo_submissions');
  }
};
