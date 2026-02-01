/**
 * Health Check Routes
 * API health and status endpoints
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getMQTTClient } from '../services/mqtt.service';
import { getConnectedClientsCount } from '../services/websocket.service';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'CSIR IoT Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check with service status
 * @access  Public
 */
router.get('/detailed', async (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState;
  const mqttClient = getMQTTClient();
  const wsClients = getConnectedClientsCount();

  const mongoStates: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const health = {
    success: true,
    status: 'healthy',
    service: 'CSIR IoT Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    services: {
      mongodb: {
        status: mongoStates[mongoStatus] || 'unknown',
        connected: mongoStatus === 1
      },
      mqtt: {
        status: mqttClient?.connected ? 'connected' : 'disconnected',
        connected: mqttClient?.connected || false
      },
      websocket: {
        status: 'running',
        connectedClients: wsClients
      }
    },
    endpoints: {
      weather: '/api/weather',
      sensors: '/api/sensors',
      iot: '/api/iot',
      auth: '/api/auth'
    }
  };

  // Determine overall health
  const isHealthy = 
    mongoStatus === 1 && 
    (mqttClient?.connected || process.env.NODE_ENV === 'development');

  res.status(isHealthy ? 200 : 503).json({
    ...health,
    status: isHealthy ? 'healthy' : 'degraded'
  });
});

/**
 * @route   GET /api/health/ready
 * @desc    Kubernetes readiness probe
 * @access  Public
 */
router.get('/ready', (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState;
  
  if (mongoStatus === 1) {
    res.status(200).json({
      success: true,
      status: 'ready'
    });
  } else {
    res.status(503).json({
      success: false,
      status: 'not ready',
      reason: 'Database not connected'
    });
  }
});

/**
 * @route   GET /api/health/live
 * @desc    Kubernetes liveness probe
 * @access  Public
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'alive'
  });
});

export default router;
