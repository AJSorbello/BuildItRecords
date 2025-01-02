'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const timestamp = new Date();
    await queryInterface.bulkInsert('labels', [
      {
        id: 'buildit-records',
        name: 'Build It Records',
        display_name: 'Build It Records',
        slug: 'buildit-records',
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: 'buildit-tech',
        name: 'Build It Tech',
        display_name: 'Build It Tech',
        slug: 'buildit-tech',
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: 'buildit-deep',
        name: 'Build It Deep',
        display_name: 'Build It Deep',
        slug: 'buildit-deep',
        created_at: timestamp,
        updated_at: timestamp
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('labels', {
      id: {
        [Sequelize.Op.in]: ['buildit-records', 'buildit-tech', 'buildit-deep']
      }
    }, {});
  }
};
