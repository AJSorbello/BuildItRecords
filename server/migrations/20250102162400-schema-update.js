'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Labels table
    await queryInterface.createTable('Labels', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      displayName: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'display_name'
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at'
      }
    });

    // Create Artists table
    await queryInterface.createTable('Artists', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      spotifyUrl: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'spotify_url'
      },
      spotifyUri: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'spotify_uri'
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'image_url'
      },
      labelId: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'label_id',
        references: {
          model: 'Labels',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at'
      }
    });

    // Create Releases table
    await queryInterface.createTable('Releases', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      releaseDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        field: 'release_date'
      },
      coverImage: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'cover_image'
      },
      spotifyUrl: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'spotify_url'
      },
      spotifyUri: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'spotify_uri'
      },
      labelId: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'label_id',
        references: {
          model: 'Labels',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      primaryArtistId: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'primary_artist_id',
        references: {
          model: 'Artists',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      totalTracks: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'total_tracks'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at'
      }
    });

    // Create Tracks table
    await queryInterface.createTable('Tracks', {
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
      spotifyUrl: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'spotify_url'
      },
      spotifyUri: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'spotify_uri'
      },
      releaseId: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'release_id',
        references: {
          model: 'Releases',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      remixerId: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'remixer_id',
        references: {
          model: 'Artists',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at'
      }
    });

    // Create ReleaseArtists join table
    await queryInterface.createTable('ReleaseArtists', {
      releaseId: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'release_id',
        references: {
          model: 'Releases',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      artistId: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'artist_id',
        references: {
          model: 'Artists',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at'
      }
    });

    // Add indexes
    await queryInterface.addIndex('Labels', ['slug']);
    await queryInterface.addIndex('Artists', ['label_id']);
    await queryInterface.addIndex('Releases', ['label_id']);
    await queryInterface.addIndex('Releases', ['primary_artist_id']);
    await queryInterface.addIndex('Releases', ['release_date']);
    await queryInterface.addIndex('Tracks', ['release_id']);
    await queryInterface.addIndex('Tracks', ['remixer_id']);
    await queryInterface.addIndex('ReleaseArtists', ['release_id', 'artist_id'], {
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('ReleaseArtists');
    await queryInterface.dropTable('Tracks');
    await queryInterface.dropTable('Releases');
    await queryInterface.dropTable('Artists');
    await queryInterface.dropTable('Labels');
  }
};
