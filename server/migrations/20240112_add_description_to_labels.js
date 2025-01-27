'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('labels', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Add descriptions for existing labels
    await queryInterface.bulkUpdate('labels', 
      { description: 'The main label for Build It Records, featuring a diverse range of electronic music.' }, 
      { id: 'buildit-records' }
    );
    await queryInterface.bulkUpdate('labels', 
      { description: 'Our techno-focused sublabel, delivering cutting-edge underground sounds.' }, 
      { id: 'buildit-tech' }
    );
    await queryInterface.bulkUpdate('labels', 
      { description: 'Deep and melodic electronic music from emerging and established artists.' }, 
      { id: 'buildit-deep' }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('labels', 'description');
  }
};
