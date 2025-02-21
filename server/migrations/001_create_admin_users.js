'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.createTable('admin_users', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false
        },
        username: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        password_hash: {
          type: Sequelize.STRING,
          allowNull: false
        },
        is_admin: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
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

      // Check if admin user exists
      const [adminUsers] = await queryInterface.sequelize.query(
        'SELECT * FROM admin_users WHERE username = :username',
        {
          replacements: { username: 'admin' },
          type: Sequelize.QueryTypes.SELECT
        }
      );

      if (!adminUsers) {
        // Create default admin user
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin', salt);
        
        await queryInterface.bulkInsert('admin_users', [{
          id: Sequelize.literal('uuid_generate_v4()'),
          username: 'admin',
          password_hash: passwordHash,
          is_admin: true,
          created_at: new Date(),
          updated_at: new Date()
        }]);
      }
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.dropTable('admin_users');
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};
