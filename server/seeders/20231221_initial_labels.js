module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('labels', [
      {
        id: 'build-it-records',
        name: 'records',
        displayName: 'Build It Records',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'build-it-tech',
        name: 'tech',
        displayName: 'Build It Tech',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'build-it-deep',
        name: 'deep',
        displayName: 'Build It Deep',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('labels', null, {});
  }
};
