/**
 * API Service
 * Handles all HTTP requests to the backend API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type { 
  CurrentWeather, 
  Sensor, 
  IoTReading, 
  TreeNode,
  APIResponse,
  PaginatedResponse,
  HealthStatus
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
    }
    return Promise.reject(error);
  }
);

// =====================
// Weather API
// =====================

export const weatherAPI = {
  /**
   * Get current weather from Open-Meteo API
   */
  async getCurrentWeather(
    latitude: number = -25.75,
    longitude: number = 28.19
  ): Promise<CurrentWeather> {
    const response = await apiClient.get<APIResponse<CurrentWeather>>(
      '/weather/current',
      { params: { latitude, longitude } }
    );
    return response.data.data;
  },

  /**
   * Get weather history from database
   */
  async getWeatherHistory(
    latitude: number = -25.75,
    longitude: number = 28.19,
    hours: number = 24
  ): Promise<CurrentWeather[]> {
    const response = await apiClient.get<APIResponse<CurrentWeather[]>>(
      '/weather/history',
      { params: { latitude, longitude, hours } }
    );
    return response.data.data;
  },

  /**
   * Get latest weather readings
   */
  async getLatestReadings(limit: number = 10): Promise<CurrentWeather[]> {
    const response = await apiClient.get<APIResponse<CurrentWeather[]>>(
      '/weather/latest',
      { params: { limit } }
    );
    return response.data.data;
  },

  /**
   * Get weather statistics
   */
  async getStatistics(latitude: number = -25.75, longitude: number = 28.19, hours: number = 24) {
    const response = await apiClient.get('/weather/statistics', {
      params: { latitude, longitude, hours }
    });
    return response.data.data;
  }
};

// =====================
// Sensors API
// =====================

export const sensorsAPI = {
  /**
   * Get all sensors
   */
  async getAllSensors(
    page: number = 1,
    limit: number = 10,
    type?: string
  ): Promise<PaginatedResponse<Sensor>> {
    const response = await apiClient.get<PaginatedResponse<Sensor>>('/sensors', {
      params: { page, limit, type }
    });
    return response.data;
  },

  /**
   * Get a single sensor by ID
   */
  async getSensor(sensorId: string): Promise<Sensor> {
    const response = await apiClient.get<APIResponse<Sensor>>(`/sensors/${sensorId}`);
    return response.data.data;
  },

  /**
   * Get sensor readings
   */
  async getSensorReadings(
    sensorId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedResponse<IoTReading>> {
    const response = await apiClient.get<PaginatedResponse<IoTReading>>(
      `/sensors/${sensorId}/readings`,
      { params: { page, limit } }
    );
    return response.data;
  },

  /**
   * Get sensor statistics
   */
  async getSensorStatistics(sensorId: string, hours: number = 24) {
    const response = await apiClient.get(`/sensors/${sensorId}/statistics`, {
      params: { hours }
    });
    return response.data.data;
  }
};

// =====================
// IoT API
// =====================

export const iotAPI = {
  /**
   * Get all IoT readings
   */
  async getReadings(
    page: number = 1,
    limit: number = 50,
    sensorId?: string
  ): Promise<PaginatedResponse<IoTReading>> {
    const response = await apiClient.get<PaginatedResponse<IoTReading>>('/iot/readings', {
      params: { page, limit, sensorId }
    });
    return response.data;
  },

  /**
   * Get latest readings for all sensors
   */
  async getLatestReadings(): Promise<IoTReading[]> {
    const response = await apiClient.get<APIResponse<IoTReading[]>>('/iot/readings/latest');
    return response.data.data;
  },

  /**
   * Submit a new IoT reading
   */
  async submitReading(sensorId: string, data: Record<string, unknown>): Promise<IoTReading> {
    const response = await apiClient.post<APIResponse<IoTReading>>('/iot/readings', {
      sensorId,
      data
    });
    return response.data.data;
  },

  /**
   * Trigger simulated IoT data
   */
  async simulate(sensorId?: string): Promise<{ reading: IoTReading; sensor: { sensorId: string; name: string } }> {
    const response = await apiClient.post('/iot/simulate', { sensorId });
    return response.data.data;
  },

  /**
   * Get IoT system status
   */
  async getStatus() {
    const response = await apiClient.get('/iot/status');
    return response.data.data;
  },

  /**
   * Get IoT data as tree structure
   */
  async getTreeData(): Promise<TreeNode> {
    const response = await apiClient.get<APIResponse<TreeNode>>('/iot/tree');
    return response.data.data;
  }
};

// =====================
// Health API
// =====================

export const healthAPI = {
  /**
   * Basic health check
   */
  async check(): Promise<{ success: boolean; status: string }> {
    const response = await apiClient.get('/health');
    return response.data;
  },

  /**
   * Detailed health check
   */
  async detailed(): Promise<HealthStatus> {
    const response = await apiClient.get<HealthStatus>('/health/detailed');
    return response.data;
  }
};

// =====================
// Auth API
// =====================

export const authAPI = {
  /**
   * Login user
   */
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Register user
   */
  async register(username: string, email: string, password: string) {
    const response = await apiClient.post('/auth/register', { username, email, password });
    return response.data;
  },

  /**
   * Get current user profile
   */
  async getProfile() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Logout
   */
  async logout() {
    const response = await apiClient.post('/auth/logout');
    localStorage.removeItem('authToken');
    return response.data;
  }
};

export default apiClient;
