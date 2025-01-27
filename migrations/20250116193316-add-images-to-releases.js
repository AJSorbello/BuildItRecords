'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('releases', 'images', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: []
    });

    // Update existing releases to set images from artwork_url
    const releases = await queryInterface.sequelize.query(
      'SELECT id, artwork_url FROM releases WHERE artwork_url IS NOT NULL',
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const release of releases) {
      if (release.artwork_url) {
        await queryInterface.sequelize.query(
          'UPDATE releases SET images = :images WHERE id = :id',
          {
            replacements: {
              id: release.id,
              images: JSON.stringify([{ url: release.artwork_url }])
            },
            type: Sequelize.QueryTypes.UPDATE
          }
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('releases', 'images');
  }
};
