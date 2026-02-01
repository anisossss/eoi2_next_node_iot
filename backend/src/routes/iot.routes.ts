/**
 * IoT Routes
 * API endpoints for IoT data and real-time operations
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, APIError } from '../middleware/error.middleware';
import { optionalAuth } from '../middleware/auth.middleware';
import { validateIoTReading, validatePagination } from '../middleware/validation.middleware';
import { IoTReading, Sensor } from '../models';
import { publishMessage, MQTT_TOPICS } from '../services/mqtt.service';
import { broadcastToClients, getConnectedClientsCount } from '../services/websocket.service';

const router = Router();

/**
 * @route   GET /api/iot/readings
 * @desc    Get all IoT readings with optional filters
 * @access  Public
 */
router.get(
  '/readings',
  validatePagination,
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const sensorId = req.query.sensorId as string;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (sensorId) filter.sensorId = sensorId;

    const [readings, total] = await Promise.all([
      IoTReading.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      IoTReading.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: readings,
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
 * @route   GET /api/iot/readings/latest
 * @desc    Get latest reading for each sensor
 * @access  Public
 */
router.get(
  '/readings/latest',
  asyncHandler(async (_req: Request, res: Response) => {
    const latestReadings = await IoTReading.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$sensorId',
          reading: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$reading' } }
    ]);

    // Enrich with sensor info
    const sensorIds = latestReadings.map(r => r.sensorId);
    const sensors = await Sensor.find({ sensorId: { $in: sensorIds } });
    const sensorMap = new Map(sensors.map(s => [s.sensorId, s]));

    const enrichedReadings = latestReadings.map(reading => ({
      ...reading,
      sensor: sensorMap.get(reading.sensorId) || null
    }));

    res.json({
      success: true,
      data: enrichedReadings,
      count: enrichedReadings.length
    });
  })
);

/**
 * @route   POST /api/iot/readings
 * @desc    Submit a new IoT reading
 * @access  Public (for sensor devices)
 */
router.post(
  '/readings',
  validateIoTReading,
  asyncHandler(async (req: Request, res: Response) => {
    const { sensorId, data, quality, rawValue } = req.body;

    // Verify sensor exists
    const sensor = await Sensor.findOne({ sensorId });
    if (!sensor) {
      throw new APIError('Sensor not found', 404);
    }

    if (!sensor.isActive) {
      throw new APIError('Sensor is inactive', 400);
    }

    // Create reading
    const reading = new IoTReading({
      sensorId,
      timestamp: new Date(),
      data,
      quality: quality || 'good',
      rawValue
    });

    await reading.save();

    // Update sensor's last reading time
    sensor.lastReading = reading.timestamp;
    await sensor.save();

    // Broadcast to WebSocket clients
    broadcastToClients('iot:reading', {
      sensorId,
      timestamp: reading.timestamp,
      data: reading.data,
      sensor: {
        name: sensor.name,
        type: sensor.type,
        location: sensor.location
      }
    });

    // Publish to MQTT
    publishMessage(`csir/sensors/${sensorId}/data`, {
      sensorId,
      timestamp: reading.timestamp,
      data: reading.data
    });

    res.status(201).json({
      success: true,
      message: 'Reading recorded successfully',
      data: reading
    });
  })
);

/**
 * @route   POST /api/iot/simulate
 * @desc    Trigger simulated IoT data broadcast
 * @access  Public
 */
router.post(
  '/simulate',
  asyncHandler(async (req: Request, res: Response) => {
    const { sensorId } = req.body;

    // Get sensor or use default
    let sensor;
    if (sensorId) {
      sensor = await Sensor.findOne({ sensorId });
      if (!sensor) {
        throw new APIError('Sensor not found', 404);
      }
    } else {
      sensor = await Sensor.findOne({ isActive: true });
      if (!sensor) {
        throw new APIError('No active sensors found', 404);
      }
    }

    // Generate simulated data
    const simulatedData = {
      temperature: 20 + Math.random() * 15, // 20-35°C
      humidity: 40 + Math.random() * 40, // 40-80%
      pressure: 1000 + Math.random() * 30, // 1000-1030 hPa
      windspeed: Math.random() * 20, // 0-20 km/h
      winddirection: Math.floor(Math.random() * 360)
    };

    // Create and save reading
    const reading = new IoTReading({
      sensorId: sensor.sensorId,
      timestamp: new Date(),
      data: simulatedData,
      quality: 'good'
    });

    await reading.save();

    // Update sensor
    sensor.lastReading = reading.timestamp;
    await sensor.save();

    // Broadcast to clients
    broadcastToClients('iot:reading', {
      sensorId: sensor.sensorId,
      timestamp: reading.timestamp,
      data: simulatedData,
      sensor: {
        name: sensor.name,
        type: sensor.type,
        location: sensor.location
      },
      isSimulated: true
    });

    res.json({
      success: true,
      message: 'Simulated data broadcasted',
      data: {
        reading,
        sensor: {
          sensorId: sensor.sensorId,
          name: sensor.name
        }
      }
    });
  })
);

/**
 * @route   GET /api/iot/status
 * @desc    Get IoT system status
 * @access  Public
 */
router.get(
  '/status',
  optionalAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    const [
      totalSensors,
      activeSensors,
      totalReadings,
      recentReadings
    ] = await Promise.all([
      Sensor.countDocuments(),
      Sensor.countDocuments({ isActive: true }),
      IoTReading.countDocuments(),
      IoTReading.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 3600000) } // Last hour
      })
    ]);

    res.json({
      success: true,
      data: {
        sensors: {
          total: totalSensors,
          active: activeSensors
        },
        readings: {
          total: totalReadings,
          lastHour: recentReadings
        },
        websocket: {
          connectedClients: getConnectedClientsCount()
        },
        timestamp: new Date()
      }
    });
  })
);

/**
 * @route   GET /api/iot/tree
 * @desc    Get IoT data in tree structure for Tree View display
 * @access  Public
 */
router.get(
  '/tree',
  asyncHandler(async (_req: Request, res: Response) => {
    const sensors = await Sensor.find().sort({ sensorId: 1 });
    
    // Build tree structure
    const tree = {
      name: 'CSIR IoT Network',
      type: 'root',
      children: await Promise.all(sensors.map(async (sensor) => {
        const latestReading = await IoTReading.findOne({ sensorId: sensor.sensorId })
          .sort({ timestamp: -1 });

        return {
          name: sensor.name,
          type: 'sensor',
          sensorId: sensor.sensorId,
          sensorType: sensor.type,
          isActive: sensor.isActive,
          location: sensor.location,
          children: latestReading ? [
            {
              name: 'Latest Reading',
              type: 'reading',
              timestamp: latestReading.timestamp,
              children: Object.entries(latestReading.data).map(([key, value]) => ({
                name: key,
                type: 'data',
                value: typeof value === 'number' ? value.toFixed(2) : value,
                unit: getUnit(key)
              }))
            }
          ] : []
        };
      }))
    };

    res.json({
      success: true,
      data: tree
    });
  })
);

/**
 * Helper function to get unit for data field
 */
function getUnit(field: string): string {
  const units: Record<string, string> = {
    temperature: '°C',
    humidity: '%',
    pressure: 'hPa',
    windspeed: 'km/h',
    winddirection: '°',
    battery: '%',
    signal_strength: 'dBm'
  };
  return units[field] || '';
}

export default router;
