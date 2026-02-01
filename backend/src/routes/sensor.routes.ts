/**
 * Sensor Routes
 * API endpoints for IoT sensor management
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, APIError } from '../middleware/error.middleware';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.middleware';
import { 
  validateSensorId, 
  validateCreateSensor, 
  validatePagination 
} from '../middleware/validation.middleware';
import { Sensor, IoTReading } from '../models';

const router = Router();

/**
 * @route   GET /api/sensors
 * @desc    Get all sensors with optional filters
 * @access  Public
 */
router.get(
  '/',
  validatePagination,
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;
    const isActive = req.query.isActive;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: Record<string, unknown> = {};
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const [sensors, total] = await Promise.all([
      Sensor.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Sensor.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: sensors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

/**
 * @route   GET /api/sensors/:sensorId
 * @desc    Get a single sensor by ID
 * @access  Public
 */
router.get(
  '/:sensorId',
  validateSensorId,
  asyncHandler(async (req: Request, res: Response) => {
    const sensor = await Sensor.findOne({ sensorId: req.params.sensorId });

    if (!sensor) {
      throw new APIError('Sensor not found', 404);
    }

    // Get latest reading for this sensor
    const latestReading = await IoTReading.findOne({ sensorId: sensor.sensorId })
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      data: {
        ...sensor.toJSON(),
        latestReading: latestReading?.data || null,
        latestReadingTime: latestReading?.timestamp || null
      }
    });
  })
);

/**
 * @route   POST /api/sensors
 * @desc    Create a new sensor
 * @access  Protected (Admin)
 */
router.post(
  '/',
  authenticateToken,
  requireRole('admin'),
  validateCreateSensor,
  asyncHandler(async (req: Request, res: Response) => {
    const { sensorId, name, type, location, configuration, metadata } = req.body;

    // Check if sensor already exists
    const existingSensor = await Sensor.findOne({ sensorId });
    if (existingSensor) {
      throw new APIError('Sensor with this ID already exists', 409);
    }

    const sensor = new Sensor({
      sensorId,
      name,
      type,
      location,
      configuration,
      metadata,
      isActive: true
    });

    await sensor.save();

    res.status(201).json({
      success: true,
      message: 'Sensor created successfully',
      data: sensor
    });
  })
);

/**
 * @route   PUT /api/sensors/:sensorId
 * @desc    Update a sensor
 * @access  Protected (Admin)
 */
router.put(
  '/:sensorId',
  authenticateToken,
  requireRole('admin'),
  validateSensorId,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, type, location, configuration, metadata, isActive } = req.body;

    const sensor = await Sensor.findOne({ sensorId: req.params.sensorId });
    
    if (!sensor) {
      throw new APIError('Sensor not found', 404);
    }

    // Update fields
    if (name !== undefined) sensor.name = name;
    if (type !== undefined) sensor.type = type;
    if (location !== undefined) sensor.location = location;
    if (configuration !== undefined) sensor.configuration = configuration;
    if (metadata !== undefined) sensor.metadata = metadata;
    if (isActive !== undefined) sensor.isActive = isActive;

    await sensor.save();

    res.json({
      success: true,
      message: 'Sensor updated successfully',
      data: sensor
    });
  })
);

/**
 * @route   DELETE /api/sensors/:sensorId
 * @desc    Delete a sensor
 * @access  Protected (Admin)
 */
router.delete(
  '/:sensorId',
  authenticateToken,
  requireRole('admin'),
  validateSensorId,
  asyncHandler(async (req: Request, res: Response) => {
    const sensor = await Sensor.findOneAndDelete({ sensorId: req.params.sensorId });

    if (!sensor) {
      throw new APIError('Sensor not found', 404);
    }

    // Optionally delete associated readings
    await IoTReading.deleteMany({ sensorId: req.params.sensorId });

    res.json({
      success: true,
      message: 'Sensor deleted successfully'
    });
  })
);

/**
 * @route   GET /api/sensors/:sensorId/readings
 * @desc    Get readings for a specific sensor
 * @access  Public
 */
router.get(
  '/:sensorId/readings',
  validateSensorId,
  validatePagination,
  asyncHandler(async (req: Request, res: Response) => {
    const { sensorId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Check sensor exists
    const sensor = await Sensor.findOne({ sensorId });
    if (!sensor) {
      throw new APIError('Sensor not found', 404);
    }

    const [readings, total] = await Promise.all([
      IoTReading.find({ sensorId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      IoTReading.countDocuments({ sensorId })
    ]);

    res.json({
      success: true,
      data: readings,
      sensor: {
        sensorId: sensor.sensorId,
        name: sensor.name,
        type: sensor.type
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

/**
 * @route   GET /api/sensors/:sensorId/statistics
 * @desc    Get statistics for a sensor
 * @access  Public
 */
router.get(
  '/:sensorId/statistics',
  validateSensorId,
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { sensorId } = req.params;
    const hours = parseInt(req.query.hours as string) || 24;

    const sensor = await Sensor.findOne({ sensorId });
    if (!sensor) {
      throw new APIError('Sensor not found', 404);
    }

    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const stats = await IoTReading.aggregate([
      {
        $match: {
          sensorId,
          timestamp: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: null,
          avgTemperature: { $avg: '$data.temperature' },
          minTemperature: { $min: '$data.temperature' },
          maxTemperature: { $max: '$data.temperature' },
          avgHumidity: { $avg: '$data.humidity' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        sensor: {
          sensorId: sensor.sensorId,
          name: sensor.name,
          type: sensor.type
        },
        statistics: stats[0] || {
          avgTemperature: null,
          minTemperature: null,
          maxTemperature: null,
          avgHumidity: null,
          count: 0
        },
        period: { hours }
      }
    });
  })
);

export default router;
