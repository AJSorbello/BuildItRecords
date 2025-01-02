module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Labels', [
      {
        id: 'buildit-records',
        name: 'records',
        displayName: 'Build It Records',
        slug: 'buildit-records',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'buildit-tech',
        name: 'tech',
        displayName: 'Build It Tech',
        slug: 'buildit-tech',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'buildit-deep',
        name: 'deep',
        displayName: 'Build It Deep',
        slug: 'buildit-deep',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Labels', null, {});
  }
};
