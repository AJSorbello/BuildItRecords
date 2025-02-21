'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the existing table if it exists
    await queryInterface.dropTable('track_artists', { cascade: true });

    // Recreate the table with the correct structure
    await queryInterface.createTable('track_artists', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      track_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'tracks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      artist_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'artists',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Add unique constraint to prevent duplicate associations
    await queryInterface.addConstraint('track_artists', {
      fields: ['track_id', 'artist_id'],
      type: 'unique',
      name: 'unique_track_artist'
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('track_artists', ['track_id']);
    await queryInterface.addIndex('track_artists', ['artist_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('track_artists');
  }
};
