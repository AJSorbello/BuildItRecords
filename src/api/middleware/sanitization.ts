import { Request, Response, NextFunction } from 'express';
import { escape } from 'validator';

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = escape(req.body[key]);
      }
    });
  }

  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = escape(req.query[key] as string);
      }
    });
  }

  next();
};
