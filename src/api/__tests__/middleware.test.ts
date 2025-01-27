import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../middleware/validation';
import { requestLogger, errorLogger } from '../middleware/logging';
import { apiLimiter, searchLimiter } from '../middleware/rateLimit';
import { trackSearchRequestSchema, importRequestSchema } from '../schemas/validation';
import { ValidationError, RateLimitError } from '../../utils/errors';

describe('API Middleware Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(requestLogger);
  });

  describe('Validation Middleware', () => {
    beforeEach(() => {
      app.post('/test/search',
        validateRequest(trackSearchRequestSchema),
        (req: Request, res: Response) => res.json({ success: true })
      );

      app.post('/test/import',
        validateRequest(importRequestSchema),
        (req: Request, res: Response) => res.json({ success: true })
      );
    });

    it('should validate correct search request', async () => {
      const response = await request(app)
        .post('/test/search')
        .send({
          query: 'test query',
          limit: 10,
          offset: 0
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should reject invalid search request', async () => {
      const response = await request(app)
        .post('/test/search')
        .send({
          query: '', // Empty query
          limit: 100 // Exceeds max limit
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate correct import request', async () => {
      const response = await request(app)
        .post('/test/import')
        .send({
          labelId: 'valid-label-id',
          options: {
            includeArtists: true,
            startDate: '2025-01-01T00:00:00Z'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should reject invalid import request', async () => {
      const response = await request(app)
        .post('/test/import')
        .send({
          labelId: '!invalid-id!',
          options: {
            startDate: 'invalid-date'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Rate Limiting Middleware', () => {
    beforeEach(() => {
      app.get('/test/api',
        apiLimiter,
        (_req: Request, res: Response) => res.json({ success: true })
      );

      app.get('/test/search',
        searchLimiter,
        (_req: Request, res: Response) => res.json({ success: true })
      );
    });

    it('should allow requests within rate limit', async () => {
      const response = await request(app)
        .get('/test/api');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should block excessive requests', async () => {
      // Make multiple requests quickly
      const requests = Array(11).fill(null).map(() =>
        request(app).get('/test/search')
      );

      const responses = await Promise.all(requests);
      const blockedResponses = responses.filter(r => r.status === 429);
      
      expect(blockedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Logging Middleware', () => {
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
      app.use(requestLogger);
      app.use(errorLogger);
      
      app.get('/test/log', (_req: Request, res: Response) => {
        res.json({ success: true });
      });

      app.get('/test/error', (_req: Request, _res: Response, next: NextFunction) => {
        next(new Error('Test error'));
      });
    });

    it('should log successful requests', async () => {
      await request(app)
        .get('/test/log');

      expect(mockLogger.info).toHaveBeenCalled();
      const logCall = mockLogger.info.mock.calls[0][1];
      expect(logCall).toHaveProperty('type', 'request_start');
      expect(logCall).toHaveProperty('method', 'GET');
      expect(logCall).toHaveProperty('url', '/test/log');
    });

    it('should log errors', async () => {
      await request(app)
        .get('/test/error');

      expect(mockLogger.error).toHaveBeenCalled();
      const errorLog = mockLogger.error.mock.calls[0][1];
      expect(errorLog).toHaveProperty('error.message', 'Test error');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        if (err instanceof ValidationError) {
          return res.status(400).json({ error: err.message });
        }
        if (err instanceof RateLimitError) {
          return res.status(429).json({ error: err.message });
        }
        res.status(500).json({ error: 'Internal server error' });
      });
    });

    it('should handle validation errors', async () => {
      app.get('/test/validation-error', (_req: Request, _res: Response, next: NextFunction) => {
        const error = new ValidationError('Invalid input');
        next(error);
      });

      const response = await request(app)
        .get('/test/validation-error');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid input' });
    });

    it('should handle rate limit errors', async () => {
      app.get('/test/rate-limit-error', (_req: Request, _res: Response, next: NextFunction) => {
        const error = new RateLimitError('Too many requests', 60000);
        next(error);
      });

      const response = await request(app)
        .get('/test/rate-limit-error');

      expect(response.status).toBe(429);
      expect(response.body).toEqual({ error: 'Too many requests' });
    });
  });
});
