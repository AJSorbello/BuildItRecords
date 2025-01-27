import { Router, Request, Response } from 'express';
import {
  Track,
  TrackType,
  TrackStatus,
  PaginatedResponse,
  QueryOptions,
  ApiResponse,
  ApiError
} from '../../types';
import { ArtistType } from '../../types/common';
import { validateRequest } from '../middleware/validation';
import { trackSchema, partialTrackSchema, paginationSchema } from '../../utils/validation';
import { asyncHandler } from '../middleware/async';
import { databaseService } from '../../services/DatabaseService';
import { spotifyService } from '../../services/SpotifyService';
import { z } from 'zod';

const router = Router();

// Get all tracks with optional filtering
router.get('/', validateRequest(
  z.object({
    query: paginationSchema.extend({
      type: z.nativeEnum(TrackType).optional(),
      status: z.nativeEnum(TrackStatus).optional(),
      artist: z.string().optional(),
      album: z.string().optional(),
      release: z.string().optional()
    })
  })
), asyncHandler(async (req: Request, res: Response) => {
  try {
    const options: QueryOptions = {
      ...req.query,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
    };
    const tracks = await databaseService.getTracks(options);
    res.json({
      success: true,
      data: tracks.items,
      pagination: {
        total: tracks.total,
        offset: tracks.offset,
        limit: tracks.limit,
        hasMore: tracks.hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch tracks',
        status: 500
      }
    });
  }
}));

// Get track by ID
router.get('/:id', validateRequest(
  z.object({
    params: z.object({
      id: z.string()
    })
  })
), asyncHandler(async (req: Request, res: Response) => {
  try {
    const track = await databaseService.getTrack(req.params.id);
    if (!track) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Track not found',
          status: 404
        }
      });
    }
    res.json({
      success: true,
      data: track
    });
  } catch (error) {
    console.error('Error fetching track:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch track',
        status: 500
      }
    });
  }
}));

// Create new track
router.post('/', validateRequest(
  z.object({
    body: trackSchema
  })
), asyncHandler(async (req: Request, res: Response) => {
  try {
    const track = await databaseService.createTrack(req.body as Track);
    res.status(201).json({
      success: true,
      data: track
    });
  } catch (error) {
    console.error('Error creating track:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create track',
        status: 500
      }
    });
  }
}));

// Import track from Spotify
router.post('/import/:spotifyId', validateRequest(
  z.object({
    params: z.object({
      spotifyId: z.string()
    })
  })
), asyncHandler(async (req: Request, res: Response) => {
  try {
    const spotifyTrack = await spotifyService.getTrack(req.params.spotifyId);
    if (!spotifyTrack) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Track not found on Spotify',
          status: 404
        }
      });
    }
    const track = spotifyService.convertSpotifyTrack(spotifyTrack);
    const savedTrack = await databaseService.createTrack(track);
    res.status(201).json({
      success: true,
      data: savedTrack
    });
  } catch (error) {
    console.error('Error importing track from Spotify:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to import track from Spotify',
        status: 500
      }
    });
  }
}));

// Update track
router.put('/:id', validateRequest(
  z.object({
    params: z.object({
      id: z.string()
    }),
    body: partialTrackSchema
  })
), asyncHandler(async (req: Request, res: Response) => {
  try {
    const track = await databaseService.updateTrack(req.params.id, req.body as Partial<Track>);
    if (!track) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Track not found',
          status: 404
        }
      });
    }
    res.json({
      success: true,
      data: track
    });
  } catch (error) {
    console.error('Error updating track:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update track',
        status: 500
      }
    });
  }
}));

// Delete track
router.delete('/:id', validateRequest(
  z.object({
    params: z.object({
      id: z.string()
    })
  })
), asyncHandler(async (req: Request, res: Response) => {
  try {
    await databaseService.deleteTrack(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting track:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete track',
        status: 500
      }
    });
  }
}));

export default router;
