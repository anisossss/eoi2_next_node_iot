/**
 * WebSocket Service
 * Handles real-time communication with the backend via Socket.IO
 */

import { io, Socket } from 'socket.io-client';
import type { IoTReadingEvent, WeatherUpdateEvent } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

type EventHandler<T> = (data: T) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<EventHandler<unknown>>> = new Map();

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected:', this.socket?.id);
        this.reconnectAttempts = 0;
        this.setupEventHandlers();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error('Failed to connect to WebSocket server'));
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      });
    });
  }

  /**
   * Setup event handlers for incoming messages
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Handle connected event
    this.socket.on('connected', (data) => {
      console.log('Server connection confirmed:', data);
      this.emit('connected', data);
    });

    // Handle IoT reading events
    this.socket.on('iot:reading', (data: IoTReadingEvent) => {
      this.emit('iot:reading', data);
    });

    // Handle weather update events
    this.socket.on('weather:update', (data: WeatherUpdateEvent) => {
      this.emit('weather:update', data);
    });

    // Handle sensor status events
    this.socket.on('sensor:status', (data) => {
      this.emit('sensor:status', data);
    });

    // Handle pong for latency check
    this.socket.on('pong', (data) => {
      this.emit('pong', data);
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  /**
   * Subscribe to a sensor's updates
   */
  subscribeSensor(sensorId: string): void {
    this.socket?.emit('subscribe:sensor', sensorId);
  }

  /**
   * Unsubscribe from a sensor's updates
   */
  unsubscribeSensor(sensorId: string): void {
    this.socket?.emit('unsubscribe:sensor', sensorId);
  }

  /**
   * Subscribe to weather updates
   */
  subscribeWeather(): void {
    this.socket?.emit('subscribe:weather');
  }

  /**
   * Subscribe to all updates
   */
  subscribeAll(): void {
    this.socket?.emit('subscribe:all');
  }

  /**
   * Send ping to check connection
   */
  ping(): void {
    this.socket?.emit('ping');
  }

  /**
   * Add event listener
   */
  on<T>(event: string, handler: EventHandler<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(handler as EventHandler<unknown>);
  }

  /**
   * Remove event listener
   */
  off<T>(event: string, handler: EventHandler<T>): void {
    this.listeners.get(event)?.delete(handler as EventHandler<unknown>);
  }

  /**
   * Emit event to local listeners
   */
  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in ${event} handler:`, error);
      }
    });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Singleton instance
export const wsService = new WebSocketService();

export default wsService;
