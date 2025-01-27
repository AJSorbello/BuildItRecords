import { Request, Response, NextFunction } from 'express';

type AsyncRequestHandler<P = any, ResBody = any, ReqBody = any, ReqQuery = any> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<any>;

export const asyncHandler = <P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
  fn: AsyncRequestHandler<P, ResBody, ReqBody, ReqQuery>
) => (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
