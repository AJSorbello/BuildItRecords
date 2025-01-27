import { Router, Request, Response } from 'express';
import { spotifyService } from '../../services/SpotifyService';
import { databaseService } from '../../services/DatabaseService';
import { Album } from '../../types/album';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/async';
import { z } from 'zod';

const router = Router();

// Get all albums
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const albums = await databaseService.getAlbums();
  res.json(albums);
}));

// Get album by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const album = await databaseService.getAlbum(id);
  if (!album) {
    return res.status(404).json({ error: 'Album not found' });
  }
  res.json(album);
}));

// Create new album
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const album: Album = req.body;
    const newAlbum = await databaseService.createAlbum(album);
    res.status(201).json(newAlbum);
  } catch (error) {
    console.error('Error creating album:', error);
    res.status(500).json({ error: 'Failed to create album' });
  }
}));

// Import album from Spotify
router.post('/import/:spotifyId', validateRequest(
  z.object({
    params: z.object({
      spotifyId: z.string()
    })
  })
), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { spotifyId } = req.params;
    const spotifyAlbum = await spotifyService.getRelease(spotifyId);
    if (!spotifyAlbum) {
      return res.status(404).json({ error: 'Album not found on Spotify' });
    }
    const album: Album = spotifyService.convertSpotifyAlbum(spotifyAlbum);
    const savedAlbum = await databaseService.createAlbum(album);
    res.status(201).json(savedAlbum);
  } catch (error) {
    console.error('Error importing album from Spotify:', error);
    res.status(500).json({ error: 'Failed to import album from Spotify' });
  }
}));

// Update album
router.put('/:id', validateRequest(
  z.object({
    params: z.object({
      id: z.string()
    }),
    body: z.object({
      name: z.string().optional(),
      artists: z.array(z.object({
        id: z.string(),
        name: z.string()
      })).optional(),
      release_date: z.string().optional(),
      label: z.string().optional()
    })
  })
), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const updatedAlbum = await databaseService.updateAlbum(id, updates);
  if (!updatedAlbum) {
    return res.status(404).json({ error: 'Album not found' });
  }
  res.json(updatedAlbum);
}));

// Delete album
router.delete('/:id', validateRequest(
  z.object({
    params: z.object({
      id: z.string()
    })
  })
), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await databaseService.deleteAlbum(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting album:', error);
    res.status(500).json({ error: 'Failed to delete album' });
  }
}));

// Get album's tracks
router.get('/:id/tracks', asyncHandler(async (req: Request, res: Response) => {
  try {
    const tracks = await databaseService.getTracksByAlbum(req.params.id);
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching album tracks:', error);
    res.status(500).json({ error: 'Failed to fetch album tracks' });
  }
}));

// Get album's popularity history
router.get('/:id/popularity', asyncHandler(async (req: Request, res: Response) => {
  try {
    const history = await databaseService.getAlbumPopularityHistory(req.params.id);
    res.json(history);
  } catch (error) {
    console.error('Error fetching popularity history:', error);
    res.status(500).json({ error: 'Failed to fetch popularity history' });
  }
}));

// Get album's market availability
router.get('/:id/markets', asyncHandler(async (req: Request, res: Response) => {
  try {
    const markets = await databaseService.getAlbumMarkets(req.params.id);
    res.json(markets);
  } catch (error) {
    console.error('Error fetching market availability:', error);
    res.status(500).json({ error: 'Failed to fetch market availability' });
  }
}));

export default router;
