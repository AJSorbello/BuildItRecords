'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create labels table
    await queryInterface.createTable('labels', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      display_name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
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

    // Create artists table
    await queryInterface.createTable('artists', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      spotify_url: {
        type: Sequelize.STRING
      },
      images: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      label_id: {
        type: Sequelize.STRING,
        references: {
          model: 'labels',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    // Create releases table
    await queryInterface.createTable('releases', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      artist_id: {
        type: Sequelize.STRING,
        references: {
          model: 'artists',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      label_id: {
        type: Sequelize.STRING,
        references: {
          model: 'labels',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      release_date: {
        type: Sequelize.DATE
      },
      images: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      spotify_url: {
        type: Sequelize.STRING
      },
      external_urls: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      external_ids: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      popularity: {
        type: Sequelize.INTEGER
      },
      total_tracks: {
        type: Sequelize.INTEGER
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

    // Create tracks table
    await queryInterface.createTable('tracks', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      duration_ms: {
        type: Sequelize.INTEGER
      },
      preview_url: {
        type: Sequelize.STRING
      },
      spotify_url: {
        type: Sequelize.STRING
      },
      external_urls: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      uri: {
        type: Sequelize.STRING
      },
      release_id: {
        type: Sequelize.STRING,
        references: {
          model: 'releases',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      artist_id: {
        type: Sequelize.STRING,
        references: {
          model: 'artists',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      label_id: {
        type: Sequelize.STRING,
        references: {
          model: 'labels',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    // Add indexes
    await queryInterface.addIndex('artists', ['label_id']);
    await queryInterface.addIndex('releases', ['artist_id', 'label_id']);
    await queryInterface.addIndex('tracks', ['artist_id', 'release_id', 'label_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('tracks');
    await queryInterface.dropTable('releases');
    await queryInterface.dropTable('artists');
    await queryInterface.dropTable('labels');
  }
};
