'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
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
        spotify_uri: {
          type: Sequelize.STRING
        },
        image_url: {
          type: Sequelize.STRING
        },
        label_id: {
          type: Sequelize.STRING,
          references: {
            model: 'labels',
            key: 'id'
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });

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
        release_date: {
          type: Sequelize.DATE,
          allowNull: true
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
        status: {
          type: Sequelize.ENUM('draft', 'scheduled', 'published'),
          allowNull: false,
          defaultValue: 'draft'
        },
        label_id: {
          type: Sequelize.STRING,
          allowNull: false,
          references: {
            model: 'labels',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        primary_artist_id: {
          type: Sequelize.STRING,
          allowNull: false,
          references: {
            model: 'artists',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        total_tracks: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });

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
        duration: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        track_number: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        disc_number: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        isrc: {
          type: Sequelize.STRING,
          allowNull: true
        },
        preview_url: {
          type: Sequelize.STRING,
          allowNull: true
        },
        spotify_url: {
          type: Sequelize.STRING,
          allowNull: true
        },
        spotify_uri: {
          type: Sequelize.STRING,
          allowNull: true
        },
        release_id: {
          type: Sequelize.STRING,
          allowNull: false,
          references: {
            model: 'releases',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        label_id: {
          type: Sequelize.STRING,
          allowNull: false,
          references: {
            model: 'labels',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        remixer_id: {
          type: Sequelize.STRING,
          allowNull: true,
          references: {
            model: 'artists',
            key: 'id'
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });

      // Create join tables
      await queryInterface.createTable('release_artists', {
        release_id: {
          type: Sequelize.STRING,
          primaryKey: true,
          references: {
            model: 'releases',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        artist_id: {
          type: Sequelize.STRING,
          primaryKey: true,
          references: {
            model: 'artists',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });

      await queryInterface.createTable('track_artists', {
        track_id: {
          type: Sequelize.STRING,
          primaryKey: true,
          references: {
            model: 'tracks',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        artist_id: {
          type: Sequelize.STRING,
          primaryKey: true,
          references: {
            model: 'artists',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });

      // Create indexes
      await queryInterface.addIndex('artists', ['name']);
      await queryInterface.addIndex('releases', ['name']);
      await queryInterface.addIndex('tracks', ['name']);
      await queryInterface.addIndex('labels', ['slug']);

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('track_artists');
    await queryInterface.dropTable('release_artists');
    await queryInterface.dropTable('tracks');
    await queryInterface.dropTable('releases');
    await queryInterface.dropTable('artists');
    await queryInterface.dropTable('labels');
  }
};
