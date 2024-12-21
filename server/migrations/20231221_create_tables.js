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
      displayName: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
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
      spotifyUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      images: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      genres: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      followersCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      popularity: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      recordLabel: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'labels',
          key: 'id'
        }
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
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
      trackTitle: {
        type: Sequelize.STRING,
        allowNull: false
      },
      artistId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'artists',
          key: 'id'
        }
      },
      featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      album: {
        type: Sequelize.JSON,
        allowNull: true
      },
      spotifyUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      previewUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      recordLabel: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'labels',
          key: 'id'
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('releases');
    await queryInterface.dropTable('artists');
    await queryInterface.dropTable('labels');
  }
};
