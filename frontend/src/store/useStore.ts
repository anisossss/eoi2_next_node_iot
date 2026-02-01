/**
 * Zustand Store
 * Global state management for the application
 */

import { create } from 'zustand';
import type { 
  CurrentWeather, 
  IoTReading, 
  Sensor, 
  TreeNode, 
  ViewMode,
  IoTReadingEvent
} from '@/types';

interface AppState {
  // View state
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  
  // Weather state
  currentWeather: CurrentWeather | null;
  setCurrentWeather: (weather: CurrentWeather | null) => void;
  isLoadingWeather: boolean;
  setLoadingWeather: (loading: boolean) => void;
  weatherError: string | null;
  setWeatherError: (error: string | null) => void;
  
  // Sensors state
  sensors: Sensor[];
  setSensors: (sensors: Sensor[]) => void;
  selectedSensor: Sensor | null;
  setSelectedSensor: (sensor: Sensor | null) => void;
  
  // IoT Readings state
  latestReadings: IoTReading[];
  setLatestReadings: (readings: IoTReading[]) => void;
  addReading: (reading: IoTReadingEvent) => void;
  
  // Tree data state
  treeData: TreeNode | null;
  setTreeData: (data: TreeNode | null) => void;
  
  // Connection state
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
  lastUpdateTime: Date | null;
  setLastUpdateTime: (time: Date | null) => void;
  
  // UI state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;
  setNotification: (notification: { type: 'success' | 'error' | 'info'; message: string } | null) => void;
  
  // Actions
  reset: () => void;
}

const initialState = {
  viewMode: 'grid' as ViewMode,
  currentWeather: null,
  isLoadingWeather: false,
  weatherError: null,
  sensors: [],
  selectedSensor: null,
  latestReadings: [],
  treeData: null,
  isConnected: false,
  lastUpdateTime: null,
  isLoading: false,
  error: null,
  notification: null,
};

export const useStore = create<AppState>((set, get) => ({
  ...initialState,
  
  // View actions
  setViewMode: (mode) => set({ viewMode: mode }),
  
  // Weather actions
  setCurrentWeather: (weather) => set({ 
    currentWeather: weather,
    lastUpdateTime: weather ? new Date() : null 
  }),
  setLoadingWeather: (loading) => set({ isLoadingWeather: loading }),
  setWeatherError: (error) => set({ weatherError: error }),
  
  // Sensors actions
  setSensors: (sensors) => set({ sensors }),
  setSelectedSensor: (sensor) => set({ selectedSensor: sensor }),
  
  // IoT Readings actions
  setLatestReadings: (readings) => set({ latestReadings: readings }),
  addReading: (reading) => {
    const { latestReadings } = get();
    
    // Find if there's an existing reading for this sensor
    const existingIndex = latestReadings.findIndex(
      (r) => r.sensorId === reading.sensorId
    );
    
    const newReading: IoTReading = {
      id: `${reading.sensorId}-${Date.now()}`,
      sensorId: reading.sensorId,
      timestamp: reading.timestamp,
      data: reading.data,
      quality: 'good',
      sensor: reading.sensor,
      isSimulated: reading.isSimulated,
    };
    
    let newReadings: IoTReading[];
    if (existingIndex >= 0) {
      // Update existing reading
      newReadings = [...latestReadings];
      newReadings[existingIndex] = newReading;
    } else {
      // Add new reading
      newReadings = [newReading, ...latestReadings].slice(0, 20);
    }
    
    set({ 
      latestReadings: newReadings,
      lastUpdateTime: new Date()
    });
  },
  
  // Tree data actions
  setTreeData: (data) => set({ treeData: data }),
  
  // Connection actions
  setConnected: (connected) => set({ isConnected: connected }),
  setLastUpdateTime: (time) => set({ lastUpdateTime: time }),
  
  // UI actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setNotification: (notification) => set({ notification }),
  
  // Reset action
  reset: () => set(initialState),
}));

export default useStore;
