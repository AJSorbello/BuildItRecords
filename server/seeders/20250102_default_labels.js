'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('labels', [
      {
        id: 'buildit-records',
        name: 'Build It Records',
        display_name: 'Build It Records',
        slug: 'buildit-records',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'buildit-tech',
        name: 'Build It Tech',
        display_name: 'Build It Tech',
        slug: 'buildit-tech',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'buildit-deep',
        name: 'Build It Deep',
        display_name: 'Build It Deep',
        slug: 'buildit-deep',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('labels', null, {});
  }
};
