'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('artists', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      bio: {
        type: Sequelize.TEXT,
      },
      imageUrl: {
        type: Sequelize.STRING,
      },
      spotifyId: {
        type: Sequelize.STRING,
      },
      spotifyUrl: {
        type: Sequelize.STRING,
      },
      beatportUrl: {
        type: Sequelize.STRING,
      },
      soundcloudUrl: {
        type: Sequelize.STRING,
      },
      labelId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'labels',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('artists');
  }
};
