/**
 * WebSocket Service
 * Handles real-time communication with the backend via Socket.IO.
 * Fails gracefully: resolves after timeout so UI can show "Disconnected" and use polling.
 */

import { io, Socket } from 'socket.io-client';
import type { IoTReadingEvent, WeatherUpdateEvent } from '@/types';

// Use same origin when in browser so production (https://iot.ainexim-eoi.co.za) uses wss:// automatically
function getWsUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_WS_URL || `${window.location.protocol === 'https:' ? 'https' : 'http'}://${window.location.host}`;
  }
  return process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
}

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

type EventHandler<T> = (data: T) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 8;
  private listeners: Map<string, Set<EventHandler<unknown>>> = new Map();
  private connectionStatusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private connectTimeoutMs = 8000;

  private setStatus(status: ConnectionStatus): void {
    this.connectionStatusListeners.forEach((cb) => {
      try {
        cb(status);
      } catch (e) {
        console.error('Connection status listener error:', e);
      }
    });
  }

  onConnectionStatus(callback: (status: ConnectionStatus) => void): () => void {
    this.connectionStatusListeners.add(callback);
    return () => this.connectionStatusListeners.delete(callback);
  }

  /**
   * Connect to WebSocket server. Resolves when connected, or after timeout so UI can show disconnected + poll.
   */
  connect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket?.connected) {
        this.setStatus('connected');
        resolve();
        return;
      }

      this.setStatus('connecting');
      const timeoutId = setTimeout(() => {
        if (!this.socket?.connected) {
          this.setStatus('disconnected');
          resolve();
        }
      }, this.connectTimeoutMs);

      this.socket = io(getWsUrl(), {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1500,
        reconnectionDelayMax: 8000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        clearTimeout(timeoutId);
        this.reconnectAttempts = 0;
        this.setupEventHandlers();
        this.setStatus('connected');
        resolve();
      });

      this.socket.on('connect_error', () => {
        this.reconnectAttempts++;
        this.setStatus(this.reconnectAttempts >= this.maxReconnectAttempts ? 'disconnected' : 'reconnecting');
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          clearTimeout(timeoutId);
          resolve();
        }
      });

      this.socket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect') this.setStatus('disconnected');
        else this.setStatus('reconnecting');
      });

      this.socket.on('reconnect', () => {
        this.reconnectAttempts = 0;
        this.setStatus('connected');
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
