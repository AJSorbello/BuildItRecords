'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop existing tables in reverse order of dependencies
    await queryInterface.dropTable('release_artists', { cascade: true });
    await queryInterface.dropTable('tracks', { cascade: true });
    await queryInterface.dropTable('releases', { cascade: true });
    await queryInterface.dropTable('artists', { cascade: true });
    await queryInterface.dropTable('labels', { cascade: true });

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
        type: Sequelize.STRING,
        allowNull: true
      },
      image_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      label_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'labels',
          key: 'id'
        }
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
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      release_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      cover_image: {
        type: Sequelize.STRING,
        allowNull: true
      },
      spotify_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      label_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'labels',
          key: 'id'
        }
      },
      primary_artist_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'artists',
          key: 'id'
        }
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
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      spotify_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      release_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'releases',
          key: 'id'
        }
      },
      remixer_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'artists',
          key: 'id'
        }
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

    // Create release_artists join table
    await queryInterface.createTable('release_artists', {
      release_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'releases',
          key: 'id'
        },
        primaryKey: true
      },
      artist_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'artists',
          key: 'id'
        },
        primaryKey: true
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('release_artists', { cascade: true });
    await queryInterface.dropTable('tracks', { cascade: true });
    await queryInterface.dropTable('releases', { cascade: true });
    await queryInterface.dropTable('artists', { cascade: true });
    await queryInterface.dropTable('labels', { cascade: true });
  }
};
