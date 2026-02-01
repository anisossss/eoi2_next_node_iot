/**
 * TypeScript type definitions for CSIR IoT Dashboard
 */

// Weather Data Types
export interface CurrentWeather {
  latitude: number;
  longitude: number;
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  is_day: number;
  timestamp: string;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  weather_description: string;
}

export interface WeatherAPIResponse {
  success: boolean;
  data: CurrentWeather;
  source: string;
  timestamp: string;
}

// Sensor Types
export interface SensorLocation {
  latitude: number;
  longitude: number;
  name: string;
  altitude?: number;
}

export interface Sensor {
  id: string;
  sensorId: string;
  name: string;
  type: 'temperature' | 'humidity' | 'pressure' | 'wind' | 'combined';
  location: SensorLocation;
  isActive: boolean;
  lastReading?: string;
  configuration?: {
    readingInterval?: number;
    thresholds?: {
      min?: number;
      max?: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

// IoT Reading Types
export interface IoTReadingData {
  temperature?: number;
  humidity?: number;
  pressure?: number;
  windspeed?: number;
  winddirection?: number;
  battery?: number;
  signal_strength?: number;
  [key: string]: unknown;
}

export interface IoTReading {
  id: string;
  sensorId: string;
  timestamp: string;
  data: IoTReadingData;
  quality: 'good' | 'fair' | 'poor';
  isAnomaly?: boolean;
  sensor?: {
    name: string;
    type: string;
    location: SensorLocation;
  };
  isSimulated?: boolean;
}

// Tree View Types
export interface TreeNode {
  name: string;
  type: 'root' | 'sensor' | 'reading' | 'data';
  sensorId?: string;
  sensorType?: string;
  isActive?: boolean;
  location?: SensorLocation;
  timestamp?: string;
  value?: string | number;
  unit?: string;
  children?: TreeNode[];
}

// Grid Item Types
export interface GridItem {
  id: string;
  title: string;
  value: string | number;
  unit?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'stable';
  timestamp?: string;
  source?: string;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// WebSocket Event Types
export interface WSEvent {
  type: string;
  data: unknown;
  timestamp: string;
}

export interface IoTReadingEvent {
  sensorId: string;
  timestamp: string;
  data: IoTReadingData;
  sensor?: {
    name: string;
    type: string;
    location: SensorLocation;
  };
  isSimulated?: boolean;
}

export interface WeatherUpdateEvent {
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  is_day: number;
  timestamp: string;
  weather_description: string;
}

// View Mode Types
export type ViewMode = 'grid' | 'tree';

// Health Status Types
export interface ServiceStatus {
  status: string;
  connected: boolean;
}

export interface HealthStatus {
  success: boolean;
  status: 'healthy' | 'degraded';
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
  memory: {
    used: string;
    total: string;
  };
  services: {
    mongodb: ServiceStatus;
    mqtt: ServiceStatus;
    websocket: {
      status: string;
      connectedClients: number;
    };
  };
}

// Weather Code Map
export const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear sky', icon: '☀️' },
  1: { description: 'Mainly clear', icon: '🌤️' },
  2: { description: 'Partly cloudy', icon: '⛅' },
  3: { description: 'Overcast', icon: '☁️' },
  45: { description: 'Fog', icon: '🌫️' },
  48: { description: 'Depositing rime fog', icon: '🌫️' },
  51: { description: 'Light drizzle', icon: '🌦️' },
  53: { description: 'Moderate drizzle', icon: '🌦️' },
  55: { description: 'Dense drizzle', icon: '🌧️' },
  61: { description: 'Slight rain', icon: '🌧️' },
  63: { description: 'Moderate rain', icon: '🌧️' },
  65: { description: 'Heavy rain', icon: '⛈️' },
  71: { description: 'Slight snowfall', icon: '🌨️' },
  73: { description: 'Moderate snowfall', icon: '🌨️' },
  75: { description: 'Heavy snowfall', icon: '❄️' },
  80: { description: 'Slight rain showers', icon: '🌦️' },
  81: { description: 'Moderate rain showers', icon: '🌧️' },
  82: { description: 'Violent rain showers', icon: '⛈️' },
  95: { description: 'Thunderstorm', icon: '⛈️' },
  96: { description: 'Thunderstorm with slight hail', icon: '⛈️' },
  99: { description: 'Thunderstorm with heavy hail', icon: '⛈️' },
};
