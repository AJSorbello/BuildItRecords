const { Label } = require('../models');

const INITIAL_LABELS = [
  {
    id: 'buildit-records',
    name: 'Build It Records',  // Used for display
    display_name: 'Build It Records',  // Used to match with Spotify
    slug: 'buildit-records'
  },
  {
    id: 'buildit-tech',
    name: 'Build It Tech',  // Used for display
    display_name: 'Build It Tech',  // Used to match with Spotify
    slug: 'buildit-tech'
  },
  {
    id: 'buildit-deep',
    name: 'Build It Deep',  // Used for display
    display_name: 'Build It Deep',  // Used to match with Spotify
    slug: 'buildit-deep'
  }
];

const seedLabels = async () => {
  try {
    console.log('Seeding labels...');
    await Label.bulkCreate(INITIAL_LABELS, {
      updateOnDuplicate: ['name', 'display_name', 'updated_at']
    });
    console.log('Labels seeded successfully');
  } catch (error) {
    console.error('Error seeding labels:', error);
    throw error;
  }
};

module.exports = {
  seedLabels,
  INITIAL_LABELS
};
