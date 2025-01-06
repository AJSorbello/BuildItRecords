const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// In-memory storage (replace with database in production)
let tracks = [];

// Get all tracks
router.get('/tracks', async (req, res) => {
  try {
    res.json({ tracks });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new track (protected)
router.post('/tracks', verifyToken, async (req, res) => {
  try {
    const { name, artist, album, spotifyUrl, category } = req.body;
    
    // Extract Spotify ID from URL
    const spotifyId = spotifyUrl.split('/').pop().split('?')[0];
    
    const newTrack = {
      id: Date.now().toString(),
      name,
      artist,
      album,
      spotifyUrl,
      spotifyId,
      category,
      albumArt: `https://i.scdn.co/image/${spotifyId}`,
      addedAt: new Date().toISOString()
    };

    tracks.push(newTrack);
    res.status(201).json(newTrack);
  } catch (error) {
    console.error('Error adding track:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update track (protected)
router.put('/tracks/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, artist, album, spotifyUrl, category } = req.body;
    
    const trackIndex = tracks.findIndex(t => t.id === id);
    if (trackIndex === -1) {
      return res.status(404).json({ message: 'Track not found' });
    }

    // Extract Spotify ID from URL if URL is updated
    let spotifyId = tracks[trackIndex].spotifyId;
    if (spotifyUrl !== tracks[trackIndex].spotifyUrl) {
      spotifyId = spotifyUrl.split('/').pop().split('?')[0];
    }

    tracks[trackIndex] = {
      ...tracks[trackIndex],
      name: name || tracks[trackIndex].name,
      artist: artist || tracks[trackIndex].artist,
      album: album || tracks[trackIndex].album,
      spotifyUrl: spotifyUrl || tracks[trackIndex].spotifyUrl,
      spotifyId,
      category: category || tracks[trackIndex].category,
      albumArt: `https://i.scdn.co/image/${spotifyId}`,
      updatedAt: new Date().toISOString()
    };

    res.json(tracks[trackIndex]);
  } catch (error) {
    console.error('Error updating track:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete track (protected)
router.delete('/tracks/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const trackIndex = tracks.findIndex(t => t.id === id);
    
    if (trackIndex === -1) {
      return res.status(404).json({ message: 'Track not found' });
    }

    tracks = tracks.filter(t => t.id !== id);
    res.json({ message: 'Track deleted successfully' });
  } catch (error) {
    console.error('Error deleting track:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
