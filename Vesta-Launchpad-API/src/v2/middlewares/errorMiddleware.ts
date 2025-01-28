import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../helper/api-errors';
import { ERROR_RESPONSE } from '../helper/customHandler';


export const errors = (
  error: Error & Partial<ApiError>,
  _: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = error.statusCode ?? 500;
  const message = error.statusCode
    ? error.message
    : 'There was an internal server error.';

  // return res.status(statusCode).json({ message: message });

  return ERROR_RESPONSE(res, false, statusCode, message);
};
