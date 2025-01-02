'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Labels table
    await queryInterface.createTable('labels', {
      id: {
        type: Sequelize.STRING, // Keep string for label IDs as they are predefined (buildit-records, etc.)
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
        unique: true,
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

    // Add index for slug lookups
    await queryInterface.addIndex('labels', ['slug']);

    // Create Artists table
    await queryInterface.createTable('artists', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      spotify_id: {
        type: Sequelize.STRING,
        unique: true,
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Changed to CASCADE as artists belong to labels
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

    // Add indexes for artist lookups
    await queryInterface.addIndex('artists', ['spotify_id']);
    await queryInterface.addIndex('artists', ['label_id', 'name']);

    // Create Releases table
    await queryInterface.createTable('releases', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      spotify_id: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      artist_id: {
        type: Sequelize.UUID,
        references: {
          model: 'artists',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      label_id: {
        type: Sequelize.STRING,
        references: {
          model: 'labels',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      release_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cover_image_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      spotify_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      external_urls: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      external_ids: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      popularity: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      total_tracks: {
        type: Sequelize.INTEGER,
        allowNull: true
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

    // Add indexes for release lookups
    await queryInterface.addIndex('releases', ['spotify_id']);
    await queryInterface.addIndex('releases', ['label_id', 'release_date']);
    await queryInterface.addIndex('releases', ['artist_id', 'release_date']);

    // Create Tracks table
    await queryInterface.createTable('tracks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      spotify_id: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      artist_id: {
        type: Sequelize.UUID,
        references: {
          model: 'artists',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      release_id: {
        type: Sequelize.UUID,
        references: {
          model: 'releases',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      duration_ms: {
        type: Sequelize.INTEGER,
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
      external_urls: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      uri: {
        type: Sequelize.STRING,
        allowNull: true
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

    // Add indexes for track lookups
    await queryInterface.addIndex('tracks', ['spotify_id']);
    await queryInterface.addIndex('tracks', ['release_id']);
    await queryInterface.addIndex('tracks', ['artist_id']);

    // Add trigger for updated_at timestamps
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Add triggers to all tables
    const tables = ['labels', 'artists', 'releases', 'tracks'];
    for (const table of tables) {
      await queryInterface.sequelize.query(`
        CREATE TRIGGER update_${table}_updated_at
            BEFORE UPDATE ON ${table}
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
      `);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove triggers first
    const tables = ['labels', 'artists', 'releases', 'tracks'];
    for (const table of tables) {
      await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};`);
    }
    await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS update_updated_at_column();');

    // Drop tables in reverse order
    await queryInterface.dropTable('tracks');
    await queryInterface.dropTable('releases');
    await queryInterface.dropTable('artists');
    await queryInterface.dropTable('labels');
  }
};
