/**
 * WebSocket Service
 * Socket.IO implementation for real-time client communication
 */

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../config/logger';

let io: Server | null = null;

// Connected clients map
const connectedClients = new Map<string, Socket>();

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
  });

  io.on('connection', handleConnection);

  logger.info('WebSocket server initialized');
  return io;
}

/**
 * Handle new WebSocket connection
 */
function handleConnection(socket: Socket): void {
  const clientId = socket.id;
  logger.info(`Client connected: ${clientId}`);
  
  // Store client
  connectedClients.set(clientId, socket);

  // Send welcome message
  socket.emit('connected', {
    message: 'Connected to CSIR IoT WebSocket Server',
    clientId,
    timestamp: new Date()
  });

  // Handle client events
  socket.on('subscribe:sensor', (sensorId: string) => {
    socket.join(`sensor:${sensorId}`);
    logger.debug(`Client ${clientId} subscribed to sensor ${sensorId}`);
    socket.emit('subscribed', { sensorId, timestamp: new Date() });
  });

  socket.on('unsubscribe:sensor', (sensorId: string) => {
    socket.leave(`sensor:${sensorId}`);
    logger.debug(`Client ${clientId} unsubscribed from sensor ${sensorId}`);
  });

  socket.on('subscribe:weather', () => {
    socket.join('weather');
    logger.debug(`Client ${clientId} subscribed to weather updates`);
  });

  socket.on('subscribe:all', () => {
    socket.join('all-updates');
    logger.debug(`Client ${clientId} subscribed to all updates`);
  });

  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date() });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    connectedClients.delete(clientId);
    logger.info(`Client disconnected: ${clientId} (${reason})`);
  });

  socket.on('error', (error) => {
    logger.error(`Socket error for client ${clientId}:`, error);
  });
}

/**
 * Broadcast message to all connected clients
 */
export function broadcastToClients(event: string, data: unknown): void {
  if (io) {
    io.emit(event, data);
    logger.debug(`Broadcasted ${event} to all clients`);
  }
}

/**
 * Send message to specific room
 */
export function sendToRoom(room: string, event: string, data: unknown): void {
  if (io) {
    io.to(room).emit(event, data);
    logger.debug(`Sent ${event} to room ${room}`);
  }
}

/**
 * Send message to specific client
 */
export function sendToClient(clientId: string, event: string, data: unknown): void {
  const socket = connectedClients.get(clientId);
  if (socket) {
    socket.emit(event, data);
    logger.debug(`Sent ${event} to client ${clientId}`);
  }
}

/**
 * Get number of connected clients
 */
export function getConnectedClientsCount(): number {
  return connectedClients.size;
}

/**
 * Get WebSocket server instance
 */
export function getIO(): Server | null {
  return io;
}

/**
 * Close WebSocket server
 */
export async function closeWebSocket(): Promise<void> {
  if (io) {
    return new Promise((resolve) => {
      io!.close(() => {
        logger.info('WebSocket server closed');
        resolve();
      });
    });
  }
}
