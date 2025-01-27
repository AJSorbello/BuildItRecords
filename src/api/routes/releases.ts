import { Router, Request, Response } from 'express';
import { databaseService } from '../../services/DatabaseService';
import { Release } from '../../types/release';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/async';
import { z } from 'zod';

const router = Router();

// Get all releases
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { label } = req.query;
  let releases;

  if (label) {
    releases = await databaseService.getReleasesByLabelId(label as string);
  } else {
    const response = await databaseService.getReleases();
    releases = response.items;
  }
  
  res.json(releases);
}));

// Get release by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const release = await databaseService.getRelease(req.params.id);
  if (!release) {
    return res.status(404).json({ error: 'Release not found' });
  }
  res.json(release);
}));

// Create new release
router.post('/', validateRequest(
  z.object({
    body: z.object({
      title: z.string(),
      artists: z.array(z.object({
        id: z.string(),
        name: z.string()
      })),
      release_date: z.string(),
      label: z.string().optional(),
      type: z.string(),
      status: z.string()
    })
  })
), asyncHandler(async (req: Request, res: Response) => {
  const release = await databaseService.createRelease(req.body);
  res.status(201).json(release);
}));

// Update release
router.put('/:id', validateRequest(
  z.object({
    params: z.object({
      id: z.string()
    }),
    body: z.object({
      title: z.string().optional(),
      artists: z.array(z.object({
        id: z.string(),
        name: z.string()
      })).optional(),
      release_date: z.string().optional(),
      label: z.string().optional(),
      type: z.string().optional(),
      status: z.string().optional()
    })
  })
), asyncHandler(async (req: Request, res: Response) => {
  const release = await databaseService.updateRelease(req.params.id, req.body);
  if (!release) {
    return res.status(404).json({ error: 'Release not found' });
  }
  res.json(release);
}));

// Delete release
router.delete('/:id', validateRequest(
  z.object({
    params: z.object({
      id: z.string()
    })
  })
), asyncHandler(async (req: Request, res: Response) => {
  await databaseService.deleteRelease(req.params.id);
  res.status(204).send();
}));

export default router;
