'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { cn, formatNumber, formatTime, getWindDirection } from '@/lib/utils';
import { WEATHER_CODES, CurrentWeather } from '@/types';
import { 
  Thermometer, 
  Wind, 
  Compass, 
  Mountain,
  Clock,
  MapPin,
  Sun,
  Moon
} from 'lucide-react';

interface WeatherCardProps {
  weather: CurrentWeather;
  className?: string;
  isUpdating?: boolean;
}

export function WeatherCard({ weather, className, isUpdating }: WeatherCardProps) {
  const weatherInfo = WEATHER_CODES[weather.weathercode] || { 
    description: 'Unknown', 
    icon: '❓' 
  };

  return (
    <Card className={cn('overflow-hidden', isUpdating && 'pulse-update', className)}>
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 px-6 py-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 text-primary-100 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                Pretoria, South Africa
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-6xl font-bold">
                {formatNumber(weather.temperature, 0)}
              </span>
              <span className="text-3xl">°C</span>
            </div>
            <p className="text-primary-100 mt-2 text-lg">
              {weatherInfo.description}
            </p>
          </div>
          <div className="text-right">
            <div className="text-6xl mb-2">{weatherInfo.icon}</div>
            <div className="flex items-center space-x-1 text-primary-100">
              {weather.is_day ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span className="text-sm">Day</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span className="text-sm">Night</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700">
          {/* Wind Speed */}
          <div className="p-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Wind className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Wind Speed</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {formatNumber(weather.windspeed)} km/h
              </p>
            </div>
          </div>

          {/* Wind Direction */}
          <div className="p-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Compass 
                className="w-5 h-5 text-green-600 dark:text-green-400"
                style={{ transform: `rotate(${weather.winddirection}deg)` }}
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Wind Direction</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {getWindDirection(weather.winddirection)} ({weather.winddirection}°)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700 border-t border-slate-200 dark:border-slate-700">
          {/* Elevation */}
          <div className="p-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Mountain className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Elevation</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {weather.elevation} m
              </p>
            </div>
          </div>

          {/* Last Update */}
          <div className="p-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Last Update</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {formatTime(weather.timestamp)}
              </p>
            </div>
          </div>
        </div>

        {/* Coordinates */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Lat: {formatNumber(weather.latitude, 4)} | Lon: {formatNumber(weather.longitude, 4)}
            </span>
            <span>
              {weather.timezone_abbreviation}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
