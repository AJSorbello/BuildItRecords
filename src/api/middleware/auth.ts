import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../../utils/errors';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedError('No authorization header');
  }

  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer') {
    throw new UnauthorizedError('Invalid authorization type');
  }

  if (!token) {
    throw new UnauthorizedError('No token provided');
  }

  // TODO: Verify token
  // For now, just pass through
  next();
};
