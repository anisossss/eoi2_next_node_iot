'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { GridView } from '@/components/views/GridView';
import { TreeView } from '@/components/views/TreeView';
import { useStore } from '@/store/useStore';
import { weatherAPI, sensorsAPI, iotAPI } from '@/services/api';
import wsService from '@/services/websocket';
import type { IoTReadingEvent, WeatherUpdateEvent } from '@/types';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Home() {
  const {
    viewMode,
    setCurrentWeather,
    setSensors,
    setLatestReadings,
    setTreeData,
    setConnectionStatus,
    addReading,
    isLoading,
    setLoading,
    error,
    setError,
  } = useStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [weather, sensorsResponse, latestReadings, treeData] = await Promise.all([
        weatherAPI.getCurrentWeather().catch(() => null),
        sensorsAPI.getAllSensors(1, 50).catch(() => ({ data: [] })),
        iotAPI.getLatestReadings().catch(() => []),
        iotAPI.getTreeData().catch(() => null),
      ]);

      if (weather) {
        setCurrentWeather(weather);
      }
      setSensors(sensorsResponse.data || []);
      setLatestReadings(latestReadings);
      if (treeData) {
        setTreeData(treeData);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setCurrentWeather, setSensors, setLatestReadings, setTreeData, setLoading, setError]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  // WebSocket: connection status + real-time events (graceful when WS fails)
  useEffect(() => {
    const unsub = wsService.onConnectionStatus((status) => {
      setConnectionStatus(status);
    });

    const setupWebSocket = async () => {
      await wsService.connect();

      wsService.subscribeAll();

      wsService.on<IoTReadingEvent>('iot:reading', (data) => {
        setIsUpdating(true);
        addReading(data);
        setTimeout(() => setIsUpdating(false), 1000);
      });

      wsService.on<WeatherUpdateEvent>('weather:update', (data) => {
        setIsUpdating(true);
        const prev = useStore.getState().currentWeather;
        setCurrentWeather({
          latitude: prev?.latitude ?? -25.75,
          longitude: prev?.longitude ?? 28.19,
          temperature: data.temperature,
          windspeed: data.windspeed,
          winddirection: data.winddirection,
          weathercode: data.weathercode,
          is_day: data.is_day,
          timestamp: data.timestamp,
          timezone: prev?.timezone ?? 'Africa/Johannesburg',
          timezone_abbreviation: prev?.timezone_abbreviation ?? 'SAST',
          elevation: prev?.elevation ?? 1395,
          weather_description: data.weather_description ?? '',
        });
        setTimeout(() => setIsUpdating(false), 1000);
      });
    };

    setupWebSocket();

    return () => {
      unsub();
      wsService.disconnect();
    };
  }, [setConnectionStatus, addReading, setCurrentWeather]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Dynamic polling: more frequent when WebSocket disconnected so data still feels live
  const connectionStatus = useStore((s) => s.connectionStatus);
  useEffect(() => {
    const ms = connectionStatus === 'connected' ? 60000 : 15000;
    const interval = setInterval(fetchData, ms);
    return () => clearInterval(interval);
  }, [fetchData, connectionStatus]);

  // Simulate IoT data for demo (every 10 seconds)
  useEffect(() => {
    const simulateData = async () => {
      try {
        await iotAPI.simulate();
      } catch (err) {
        console.log('Simulation not available');
      }
    };

    // Start simulation after initial load
    const timeout = setTimeout(() => {
      simulateData();
    }, 5000);

    const interval = setInterval(simulateData, 10000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen relative z-10">
      <Header onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-3 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          /* Main Content */
          <>
            {viewMode === 'grid' ? (
              <GridView isUpdating={isUpdating} />
            ) : (
              <TreeView isUpdating={isUpdating} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <p>
              CSIR IoT Weather Dashboard - EOI No. 8121/10/02/2026
            </p>
            <p className="mt-2 md:mt-0">
              Powered by Open-Meteo API | Built with Next.js & TypeScript
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
