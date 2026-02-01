/**
 * Validation Middleware
 * Request validation using express-validator
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, body, param, query } from 'express-validator';

/**
 * Handle validation errors
 */
export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg
      }))
    });
    return;
  }
  
  next();
}

/**
 * Weather query validation
 */
export const validateWeatherQuery = [
  query('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  handleValidationErrors
];

/**
 * Sensor ID parameter validation
 */
export const validateSensorId = [
  param('sensorId')
    .notEmpty()
    .withMessage('Sensor ID is required')
    .isString()
    .trim(),
  handleValidationErrors
];

/**
 * Create sensor validation
 */
export const validateCreateSensor = [
  body('sensorId')
    .notEmpty()
    .withMessage('Sensor ID is required')
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Sensor ID must be between 3 and 50 characters'),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['temperature', 'humidity', 'pressure', 'wind', 'combined'])
    .withMessage('Invalid sensor type'),
  body('location.latitude')
    .notEmpty()
    .withMessage('Location latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.longitude')
    .notEmpty()
    .withMessage('Location longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('location.name')
    .notEmpty()
    .withMessage('Location name is required')
    .isString()
    .trim(),
  handleValidationErrors
];

/**
 * User registration validation
 */
export const validateUserRegistration = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isString()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

/**
 * User login validation
 */
export const validateUserLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * IoT reading validation
 */
export const validateIoTReading = [
  body('sensorId')
    .notEmpty()
    .withMessage('Sensor ID is required')
    .isString()
    .trim(),
  body('data')
    .notEmpty()
    .withMessage('Data is required')
    .isObject()
    .withMessage('Data must be an object'),
  handleValidationErrors
];

/**
 * Pagination validation
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];
