import { Router, Request, Response } from 'express';
import { databaseService } from '../../services/DatabaseService';
import { asyncHandler } from '../middleware/async';
import { Artist } from '../../types';

const router = Router();

// Get all artists
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { label, offset, limit } = req.query;
  const response = await databaseService.getArtists({ 
    label: label as string,
    offset: offset ? parseInt(offset as string) : 0,
    limit: limit ? parseInt(limit as string) : 20
  });
  res.json(response);
}));

// Get artist by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const artist = await databaseService.getArtist(id);
  if (!artist) {
    return res.status(404).json({ error: 'Artist not found' });
  }
  res.json(artist);
}));

// Create artist
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const artist = await databaseService.createArtist({
    ...req.body,
    created_at: new Date(),
    updated_at: new Date()
  });
  res.status(201).json(artist);
}));

// Update artist
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const artist = await databaseService.updateArtist(id, {
    ...updates,
    updated_at: new Date()
  });
  if (!artist) {
    return res.status(404).json({ error: 'Artist not found' });
  }
  res.json(artist);
}));

// Delete artist
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await databaseService.deleteArtist(id);
  res.status(204).send();
}));

// Get artist's tracks
router.get('/:id/tracks', asyncHandler(async (req: Request, res: Response) => {
  const tracks = await databaseService.getArtistTracks(req.params.id);
  res.json(tracks);
}));

// Get artist's releases
router.get('/:id/releases', asyncHandler(async (req: Request, res: Response) => {
  const releases = await databaseService.getArtistReleases(req.params.id);
  res.json(releases);
}));

export default router;
