const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Labels table
    await queryInterface.createTable('Labels', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      description: DataTypes.TEXT,
      imageUrl: DataTypes.STRING,
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // Create Artists table
    await queryInterface.createTable('Artists', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      spotifyId: {
        type: DataTypes.STRING,
        unique: true
      },
      imageUrl: DataTypes.STRING,
      labelId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Labels',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // Create Releases table
    await queryInterface.createTable('Releases', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      spotifyId: {
        type: DataTypes.STRING,
        unique: true
      },
      releaseDate: DataTypes.DATE,
      imageUrl: DataTypes.STRING,
      previewUrl: DataTypes.STRING,
      artistId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Artists',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      labelId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Labels',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Releases');
    await queryInterface.dropTable('Artists');
    await queryInterface.dropTable('Labels');
  }
};
