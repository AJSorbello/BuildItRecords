const express = require('express');
const router = express.Router();
const { Release, Artist, Label } = require('../models');

// GET /api/releases/:labelSlug
router.get('/:labelSlug', async (req, res) => {
  try {
    const { labelSlug } = req.params;
    
    const releases = await Release.findAll({
      include: [
        {
          model: Artist,
          as: 'artist',
          attributes: ['name', 'imageUrl', 'spotifyId']
        },
        {
          model: Label,
          as: 'label',
          where: { slug: labelSlug },
          attributes: ['name', 'slug']
        }
      ],
      order: [['releaseDate', 'DESC']]
    });

    res.json(releases);
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
