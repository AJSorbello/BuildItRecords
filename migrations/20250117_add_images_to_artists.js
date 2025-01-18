'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add images column
    await queryInterface.addColumn('artists', 'images', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: []
    });

    // Copy existing image_url to images array if it exists
    await queryInterface.sequelize.query(`
      UPDATE artists 
      SET images = jsonb_build_array(
        jsonb_build_object(
          'url', image_url,
          'width', 640,
          'height', 640
        )
      )
      WHERE image_url IS NOT NULL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('artists', 'images');
  }
};
