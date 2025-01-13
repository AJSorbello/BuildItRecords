'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Create labels table
      await queryInterface.createTable('labels', {
        id: {
          type: Sequelize.STRING,
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        display_name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        slug: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });

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
        spotify_uri: {
          type: Sequelize.STRING
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });

      // Create releases table
      await queryInterface.createTable('releases', {
        id: {
          type: Sequelize.STRING,
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        label_id: {
          type: Sequelize.STRING,
          references: {
            model: 'labels',
            key: 'id'
          },
          allowNull: false
        },
        release_date: {
          type: Sequelize.DATE,
          allowNull: false
        },
        artwork_url: {
          type: Sequelize.STRING
        },
        spotify_url: {
          type: Sequelize.STRING
        },
        spotify_uri: {
          type: Sequelize.STRING
        },
        total_tracks: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        status: {
          type: Sequelize.ENUM('draft', 'scheduled', 'published'),
          allowNull: false,
          defaultValue: 'draft'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });

      // Create tracks table
      await queryInterface.createTable('tracks', {
        id: {
          type: Sequelize.STRING,
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        release_id: {
          type: Sequelize.STRING,
          references: {
            model: 'releases',
            key: 'id'
          },
          allowNull: false
        },
        duration: {
          type: Sequelize.INTEGER
        },
        track_number: {
          type: Sequelize.INTEGER
        },
        preview_url: {
          type: Sequelize.STRING
        },
        spotify_url: {
          type: Sequelize.STRING
        },
        spotify_uri: {
          type: Sequelize.STRING
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });

      // Create track_artists table
      await queryInterface.createTable('track_artists', {
        track_id: {
          type: Sequelize.STRING,
          primaryKey: true,
          references: {
            model: 'tracks',
            key: 'id'
          },
          allowNull: false
        },
        artist_id: {
          type: Sequelize.STRING,
          primaryKey: true,
          references: {
            model: 'artists',
            key: 'id'
          },
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });

      // Create release_artists table with role field
      await queryInterface.createTable('release_artists', {
        release_id: {
          type: Sequelize.STRING,
          primaryKey: true,
          references: {
            model: 'releases',
            key: 'id'
          },
          allowNull: false
        },
        artist_id: {
          type: Sequelize.STRING,
          primaryKey: true,
          references: {
            model: 'artists',
            key: 'id'
          },
          allowNull: false
        },
        role: {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: 'primary'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });

      // Add indexes
      await queryInterface.addIndex('releases', ['label_id'], { transaction });
      await queryInterface.addIndex('releases', ['release_date'], { transaction });
      await queryInterface.addIndex('tracks', ['release_id'], { transaction });
      await queryInterface.addIndex('track_artists', ['track_id'], { transaction });
      await queryInterface.addIndex('track_artists', ['artist_id'], { transaction });
      await queryInterface.addIndex('release_artists', ['release_id'], { transaction });
      await queryInterface.addIndex('release_artists', ['artist_id'], { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('track_artists', { transaction });
      await queryInterface.dropTable('release_artists', { transaction });
      await queryInterface.dropTable('tracks', { transaction });
      await queryInterface.dropTable('releases', { transaction });
      await queryInterface.dropTable('artists', { transaction });
      await queryInterface.dropTable('labels', { transaction });
    });
  }
};
