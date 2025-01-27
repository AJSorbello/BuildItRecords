import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // Update tracks table
    await queryInterface.sequelize.query(`
      UPDATE tracks
      SET label_id = 'BUILD_IT'
      WHERE label_id = 'buildit-records';
    `);

    await queryInterface.sequelize.query(`
      UPDATE tracks
      SET label_id = 'TECH'
      WHERE label_id = 'buildit-tech';
    `);

    await queryInterface.sequelize.query(`
      UPDATE tracks
      SET label_id = 'HOUSE'
      WHERE label_id = 'buildit-deep';
    `);

    // Update releases table
    await queryInterface.sequelize.query(`
      UPDATE releases
      SET label_id = 'BUILD_IT'
      WHERE label_id = 'buildit-records';
    `);

    await queryInterface.sequelize.query(`
      UPDATE releases
      SET label_id = 'TECH'
      WHERE label_id = 'buildit-tech';
    `);

    await queryInterface.sequelize.query(`
      UPDATE releases
      SET label_id = 'HOUSE'
      WHERE label_id = 'buildit-deep';
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    // Revert tracks table
    await queryInterface.sequelize.query(`
      UPDATE tracks
      SET label_id = 'buildit-records'
      WHERE label_id = 'BUILD_IT';
    `);

    await queryInterface.sequelize.query(`
      UPDATE tracks
      SET label_id = 'buildit-tech'
      WHERE label_id = 'TECH';
    `);

    await queryInterface.sequelize.query(`
      UPDATE tracks
      SET label_id = 'buildit-deep'
      WHERE label_id = 'HOUSE';
    `);

    // Revert releases table
    await queryInterface.sequelize.query(`
      UPDATE releases
      SET label_id = 'buildit-records'
      WHERE label_id = 'BUILD_IT';
    `);

    await queryInterface.sequelize.query(`
      UPDATE releases
      SET label_id = 'buildit-tech'
      WHERE label_id = 'TECH';
    `);

    await queryInterface.sequelize.query(`
      UPDATE releases
      SET label_id = 'buildit-deep'
      WHERE label_id = 'HOUSE';
    `);
  }
};
