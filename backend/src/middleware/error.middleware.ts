/**
 * Error Handling Middleware
 * Centralized error handling for the API
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/**
 * Custom API Error class
 */
export class APIError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const error = new APIError(`Not found: ${req.method} ${req.originalUrl}`, 404);
  next(error);
}

/**
 * Global error handler
 */
export function errorHandler(
  err: Error | APIError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let stack: string | undefined;

  // Handle known error types
  if (err instanceof APIError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if ((err as unknown as { code: number }).code === 11000) {
      statusCode = 409;
      message = 'Duplicate entry';
    }
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    stack = err.stack;
  }

  // Log error
  logger.error(`Error: ${message}`, {
    statusCode,
    stack: err.stack,
    name: err.name
  });

  // Send response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(stack && { stack })
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
