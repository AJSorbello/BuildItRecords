import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { DatabaseError, ResourceNotFoundError } from '../../utils/errors';
import { ApiResponse } from '../../types';

export const errorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response<ApiResponse<any>>, next: NextFunction): void => {
  console.error('Error:', err);

  if (err instanceof ResourceNotFoundError) {
    res.status(404).json({
      success: false,
      error: {
        message: err.message,
        status: 404,
        code: 'NOT_FOUND',
        resourceType: err.resourceType,
        resourceId: err.resourceId
      }
    });
    return;
  }

  if (err instanceof DatabaseError) {
    res.status(500).json({
      success: false,
      error: {
        message: err.message,
        status: 500,
        code: err.code || 'DATABASE_ERROR'
      }
    });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    error: {
      message: 'An unexpected error occurred',
      status: 500,
      code: 'INTERNAL_SERVER_ERROR'
    }
  });
};
