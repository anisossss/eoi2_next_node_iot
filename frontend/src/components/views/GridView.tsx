'use client';

import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { WeatherCard } from '@/components/weather/WeatherCard';
import { cn, formatNumber, formatTime, formatRelativeTime } from '@/lib/utils';
import { 
  Thermometer, 
  Droplets, 
  Gauge, 
  Wind,
  Activity,
  Radio,
  Battery,
  MapPin,
  Clock
} from 'lucide-react';
import type { IoTReading } from '@/types';

interface GridViewProps {
  isUpdating?: boolean;
}

export function GridView({ isUpdating }: GridViewProps) {
  const { currentWeather, latestReadings, sensors } = useStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="w-5 h-5" />;
      case 'humidity':
        return <Droplets className="w-5 h-5" />;
      case 'pressure':
        return <Gauge className="w-5 h-5" />;
      case 'wind':
        return <Wind className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getUnit = (key: string): string => {
    const units: Record<string, string> = {
      temperature: '°C',
      humidity: '%',
      pressure: 'hPa',
      windspeed: 'km/h',
      winddirection: '°',
      battery: '%',
      signal_strength: 'dBm'
    };
    return units[key] || '';
  };

  const getColorClass = (key: string): string => {
    const colors: Record<string, string> = {
      temperature: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      humidity: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      pressure: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      windspeed: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
      winddirection: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      battery: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
      signal_strength: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
    };
    return colors[key] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Weather Section — dynamic data with incoming animation */}
      <section className="animate-fade-in">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
          <span>Current Weather</span>
          {isUpdating && (
            <span className="inline-flex items-center gap-1 text-xs font-normal text-primary-500 animate-pulse">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75 animate-ping" />
                <span className="relative rounded-full h-1.5 w-1.5 bg-primary-500" />
              </span>
              Receiving
            </span>
          )}
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
            (Live API)
          </span>
        </h2>
        {currentWeather ? (
          <WeatherCard weather={currentWeather} isUpdating={isUpdating} />
        ) : (
          <Card className="p-8 bg-grid-pattern bg-grid animate-pulse-slow border-primary-200 dark:border-primary-800/50">
            <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
              <Activity className="w-8 h-8 mb-3 animate-pulse text-primary-400" />
              <span>Fetching weather data...</span>
              <span className="text-xs mt-1 opacity-80">API may be reconnecting</span>
            </div>
          </Card>
        )}
      </section>

      {/* IoT Sensors Section */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
          <Radio className="w-5 h-5 text-primary-500" />
          <span>IoT Sensor Readings</span>
          <span className="text-xs font-normal bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-full">
            {latestReadings.length} sensors
          </span>
        </h2>

        {latestReadings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestReadings.map((reading, i) => (
              <div
                key={reading.id}
                className="stagger-fade-in"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <SensorCard reading={reading} isUpdating={isUpdating} />
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-8 bg-grid-pattern bg-grid border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
              <Radio className="w-8 h-8 mb-2 opacity-50 animate-pulse" />
              <p>No sensor readings available</p>
              <p className="text-xs mt-1">Waiting for IoT data...</p>
            </div>
          </Card>
        )}
      </section>

      {/* Data Grid Section */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Data Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {currentWeather && (
            <>
              <DataCard
                title="Temperature"
                value={formatNumber(currentWeather.temperature, 1)}
                unit="°C"
                icon={<Thermometer className="w-5 h-5" />}
                colorClass="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              />
              <DataCard
                title="Wind Speed"
                value={formatNumber(currentWeather.windspeed, 1)}
                unit="km/h"
                icon={<Wind className="w-5 h-5" />}
                colorClass="bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400"
              />
              <DataCard
                title="Elevation"
                value={currentWeather.elevation.toString()}
                unit="m"
                icon={<MapPin className="w-5 h-5" />}
                colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              />
              <DataCard
                title="Active Sensors"
                value={sensors.filter(s => s.isActive).length.toString()}
                unit="online"
                icon={<Radio className="w-5 h-5" />}
                colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

// Sensor Card Component
function SensorCard({ reading, isUpdating }: { reading: IoTReading; isUpdating?: boolean }) {
  const isRecent = new Date().getTime() - new Date(reading.timestamp).getTime() < 60000;

  return (
    <Card className={cn('grid-card', isRecent && isUpdating && 'pulse-update data-incoming')}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm">
              {reading.sensor?.name || reading.sensorId}
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {reading.sensor?.type || 'combined'} sensor
            </p>
          </div>
          <div className={cn(
            'w-2 h-2 rounded-full',
            isRecent ? 'bg-green-500 animate-pulse' : 'bg-slate-400'
          )} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Location */}
        {reading.sensor?.location && (
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-3">
            <MapPin className="w-3 h-3 mr-1" />
            <span>{reading.sensor.location.name}</span>
          </div>
        )}

        {/* Data Values */}
        <div className="space-y-2">
          {Object.entries(reading.data).map(([key, value]) => {
            if (typeof value !== 'number') return null;
            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                  {key.replace('_', ' ')}
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {formatNumber(value, 1)} {getUnit(key)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Timestamp */}
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
            <Clock className="w-3 h-3 mr-1" />
            <span>{formatRelativeTime(reading.timestamp)}</span>
          </div>
          {reading.isSimulated && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">
              Simulated
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Data Card Component
function DataCard({ 
  title, 
  value, 
  unit, 
  icon, 
  colorClass 
}: { 
  title: string; 
  value: string; 
  unit: string; 
  icon: React.ReactNode;
  colorClass: string;
}) {
  return (
    <Card className="grid-card">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorClass)}>
            {icon}
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {value} <span className="text-sm font-normal text-slate-500">{unit}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function
function getUnit(key: string): string {
  const units: Record<string, string> = {
    temperature: '°C',
    humidity: '%',
    pressure: 'hPa',
    windspeed: 'km/h',
    winddirection: '°',
    battery: '%',
    signal_strength: 'dBm'
  };
  return units[key] || '';
}
