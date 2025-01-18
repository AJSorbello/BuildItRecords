'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Labels', [
      {
        id: 'buildit-records',
        name: 'Records',
        display_name: 'Build It Records',
        slug: 'buildit-records',
        description: 'The main label for Build It Records, featuring a diverse range of electronic music.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'buildit-tech',
        name: 'Tech',
        display_name: 'Build It Tech',
        slug: 'buildit-tech',
        description: 'Our techno-focused sublabel, delivering cutting-edge underground sounds.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'buildit-deep',
        name: 'Deep',
        display_name: 'Build It Deep',
        slug: 'buildit-deep',
        description: 'Deep and melodic electronic music from emerging and established artists.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Labels', null, {});
  }
};
