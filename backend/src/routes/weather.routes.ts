/**
 * Weather Routes
 * API endpoints for weather data from Open-Meteo API
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { validateWeatherQuery, validatePagination } from '../middleware/validation.middleware';
import { 
  fetchWeatherFromAPI, 
  getHistoricalWeather,
  WEATHER_CODES,
  getWeatherDescription
} from '../services/weather.service';
import { WeatherData } from '../models';

const router = Router();

/**
 * @route   GET /api/weather/current
 * @desc    Get current weather from Open-Meteo API
 * @access  Public
 */
router.get(
  '/current',
  validateWeatherQuery,
  asyncHandler(async (req: Request, res: Response) => {
    const latitude = parseFloat(req.query.latitude as string) || -25.75;
    const longitude = parseFloat(req.query.longitude as string) || 28.19;

    const weather = await fetchWeatherFromAPI(latitude, longitude);

    res.json({
      success: true,
      data: weather,
      source: 'open-meteo-api',
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * @route   GET /api/weather/history
 * @desc    Get historical weather data from database
 * @access  Public
 */
router.get(
  '/history',
  validateWeatherQuery,
  validatePagination,
  asyncHandler(async (req: Request, res: Response) => {
    const latitude = parseFloat(req.query.latitude as string) || -25.75;
    const longitude = parseFloat(req.query.longitude as string) || 28.19;
    const hours = parseInt(req.query.hours as string) || 24;

    const history = await getHistoricalWeather(latitude, longitude, hours);

    res.json({
      success: true,
      data: history,
      count: history.length,
      query: { latitude, longitude, hours }
    });
  })
);

/**
 * @route   GET /api/weather/codes
 * @desc    Get weather code descriptions
 * @access  Public
 */
router.get('/codes', (_req: Request, res: Response) => {
  const codes = Object.entries(WEATHER_CODES).map(([code, description]) => ({
    code: parseInt(code),
    description
  }));

  res.json({
    success: true,
    data: codes
  });
});

/**
 * @route   GET /api/weather/code/:code
 * @desc    Get description for a specific weather code
 * @access  Public
 */
router.get('/code/:code', (req: Request, res: Response) => {
  const code = parseInt(req.params.code);
  const description = getWeatherDescription(code);

  res.json({
    success: true,
    data: {
      code,
      description
    }
  });
});

/**
 * @route   GET /api/weather/latest
 * @desc    Get latest weather readings from database
 * @access  Public
 */
router.get(
  '/latest',
  validatePagination,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;

    const readings = await WeatherData.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();

    res.json({
      success: true,
      data: readings,
      count: readings.length
    });
  })
);

/**
 * @route   GET /api/weather/statistics
 * @desc    Get weather statistics for a location
 * @access  Public
 */
router.get(
  '/statistics',
  validateWeatherQuery,
  asyncHandler(async (req: Request, res: Response) => {
    const latitude = parseFloat(req.query.latitude as string) || -25.75;
    const longitude = parseFloat(req.query.longitude as string) || 28.19;
    const hours = parseInt(req.query.hours as string) || 24;

    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const stats = await WeatherData.aggregate([
      {
        $match: {
          latitude: { $gte: latitude - 0.1, $lte: latitude + 0.1 },
          longitude: { $gte: longitude - 0.1, $lte: longitude + 0.1 },
          timestamp: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: null,
          avgTemperature: { $avg: '$temperature' },
          minTemperature: { $min: '$temperature' },
          maxTemperature: { $max: '$temperature' },
          avgWindspeed: { $avg: '$windspeed' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        avgTemperature: null,
        minTemperature: null,
        maxTemperature: null,
        avgWindspeed: null,
        count: 0
      },
      query: { latitude, longitude, hours }
    });
  })
);

export default router;
