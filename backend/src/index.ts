/**
 * CSIR IoT Backend API Server
 * Main entry point for Express.js application
 * 
 * Features:
 * - RESTful API endpoints
 * - JWT authentication
 * - MQTT integration for IoT data
 * - WebSocket support for real-time updates
 * - MongoDB database integration
 */

import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database';
import { initializeMQTT } from './services/mqtt.service';
import { initializeWebSocket } from './services/websocket.service';
import { logger } from './config/logger';

// Routes
import healthRoutes from './routes/health.routes';
import weatherRoutes from './routes/weather.routes';
import sensorRoutes from './routes/sensor.routes';
import authRoutes from './routes/auth.routes';
import iotRoutes from './routes/iot.routes';

// Error handler
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

// Create Express application
const app: Application = express();
const httpServer = createServer(app);

// Configuration
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/iot', iotRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'CSIR IoT Backend API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      health: '/api/health',
      weather: '/api/weather',
      sensors: '/api/sensors',
      iot: '/api/iot',
      auth: '/api/auth'
    }
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize services and start server
async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectDatabase();
    logger.info('✅ Connected to MongoDB');

    // Initialize MQTT client (optional - will continue without if broker not available)
    const mqttClient = await initializeMQTT();
    if (mqttClient) {
      logger.info('✅ MQTT client initialized');
    } else {
      logger.warn('⚠️ MQTT broker not available - running without MQTT support');
    }

    // Initialize WebSocket server
    initializeWebSocket(httpServer);
    logger.info('✅ WebSocket server initialized');

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 CSIR IoT Backend running on port ${PORT}`);
      logger.info(`📊 Environment: ${NODE_ENV}`);
      logger.info(`🌐 API Documentation: http://localhost:${PORT}/api/health`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Start the server
startServer();

export { app, httpServer };
