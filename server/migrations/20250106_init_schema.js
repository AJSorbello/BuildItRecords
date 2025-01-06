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
        title: {
          type: Sequelize.STRING,
          allowNull: false
        },
        release_date: {
          type: Sequelize.DATE,
          allowNull: false
        },
        cover_image: {
          type: Sequelize.STRING
        },
        spotify_url: {
          type: Sequelize.STRING
        },
        spotify_uri: {
          type: Sequelize.STRING
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
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE'
        },
        total_tracks: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        record_label: {
          type: Sequelize.STRING,
          validate: {
            isLabelFormat(value) {
              if (value && !value.match(/^label:"[^"]+?"$/)) {
                throw new Error('Record label must be in format: label:"name"');
              }
            }
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
          allowNull: false
        },
        track_number: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        disc_number: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        isrc: {
          type: Sequelize.STRING
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
        remixer_id: {
          type: Sequelize.STRING,
          references: {
            model: 'artists',
            key: 'id'
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        record_label: {
          type: Sequelize.STRING,
          validate: {
            isLabelFormat(value) {
              if (value && !value.match(/^label:"[^"]+?"$/)) {
                throw new Error('Record label must be in format: label:"name"');
              }
            }
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

      // Create release_artists table
      await queryInterface.createTable('release_artists', {
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
        artist_id: {
          type: Sequelize.STRING,
          allowNull: false,
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

      // Add primary key constraint to release_artists
      await queryInterface.addConstraint('release_artists', {
        fields: ['release_id', 'artist_id'],
        type: 'primary key',
        name: 'release_artists_pkey'
      });

      // Create import_logs table
      await queryInterface.createTable('import_logs', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        label_id: {
          type: Sequelize.STRING,
          allowNull: false,
          references: {
            model: 'labels',
            key: 'id'
          }
        },
        status: {
          type: Sequelize.STRING,
          allowNull: false
        },
        message: {
          type: Sequelize.TEXT
        },
        completed_at: {
          type: Sequelize.DATE
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE
        }
      });

      // Add check constraints for record_label format
      await queryInterface.sequelize.query(`
        ALTER TABLE "releases"
        ADD CONSTRAINT check_release_record_label_format
        CHECK (record_label ~ '^label:"[^"]+"$' OR record_label IS NULL)
      `);

      await queryInterface.sequelize.query(`
        ALTER TABLE "tracks"
        ADD CONSTRAINT check_track_record_label_format
        CHECK (record_label ~ '^label:"[^"]+"$' OR record_label IS NULL)
      `);

    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Drop tables in reverse order
      await queryInterface.dropTable('import_logs');
      await queryInterface.dropTable('release_artists');
      await queryInterface.dropTable('tracks');
      await queryInterface.dropTable('releases');
      await queryInterface.dropTable('artists');
      await queryInterface.dropTable('labels');
    } catch (error) {
      console.error('Migration rollback error:', error);
      throw error;
    }
  }
};
