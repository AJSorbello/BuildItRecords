/**
 * @module Validation
 * @description Express middleware for request validation using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../types/errors';
import { logger } from '../../utils/logger';
import { z } from 'zod';
import {
  trackSchema,
  albumSchema,
  artistSchema,
  paginationSchema,
  searchParamsSchema
} from '../../utils/validation';

/**
 * Creates a middleware function that validates request data against a schema
 */
export const validateRequest = <T extends z.ZodType>(schema: T) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });

      // Replace request data with validated data
      req.body = validatedData.body;
      req.query = validatedData.query;
      req.params = validatedData.params;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error:', error.errors);
        res.status(400).json({
          error: 'Invalid request data',
          details: error.errors
        });
      } else {
        next(error);
      }
    }
  };
};

// Request validation schemas
const trackRequestSchema = z.object({
  body: trackSchema.optional(),
  query: searchParamsSchema.merge(paginationSchema),
  params: z.object({ id: z.string().optional() })
});

const albumRequestSchema = z.object({
  body: albumSchema.optional(),
  query: searchParamsSchema.merge(paginationSchema),
  params: z.object({ id: z.string().optional() })
});

const artistRequestSchema = z.object({
  body: artistSchema.optional(),
  query: searchParamsSchema.merge(paginationSchema),
  params: z.object({ id: z.string().optional() })
});

// Export middleware
export const validateTrackRequest = validateRequest(trackRequestSchema);
export const validateAlbumRequest = validateRequest(albumRequestSchema);
export const validateArtistRequest = validateRequest(artistRequestSchema);
