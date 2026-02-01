/**
 * Weather Service
 * Fetches weather data from Open-Meteo API and manages weather data
 */

import axios, { AxiosError } from 'axios';
import { logger } from '../config/logger';
import { WeatherData, IWeatherData } from '../models';
import { broadcastToClients } from './websocket.service';

// Open-Meteo API base URL
const OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast';

// Default coordinates (Pretoria, South Africa - CSIR location)
const DEFAULT_COORDS = {
  latitude: -25.75,
  longitude: 28.19
};

export interface WeatherAPIResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_weather: {
    time: string;
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    is_day: number;
  };
}

export interface ProcessedWeatherData {
  latitude: number;
  longitude: number;
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  is_day: number;
  timestamp: Date;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  weather_description: string;
}

/**
 * Weather code descriptions (WMO codes)
 */
export const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail'
};

/**
 * Fetch current weather from Open-Meteo API
 */
export async function fetchWeatherFromAPI(
  latitude: number = DEFAULT_COORDS.latitude,
  longitude: number = DEFAULT_COORDS.longitude
): Promise<ProcessedWeatherData> {
  try {
    const url = `${OPEN_METEO_API}?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    
    logger.info(`Fetching weather data from: ${url}`);
    
    const response = await axios.get<WeatherAPIResponse>(url, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = response.data;
    const currentWeather = data.current_weather;

    const processedData: ProcessedWeatherData = {
      latitude: data.latitude,
      longitude: data.longitude,
      temperature: currentWeather.temperature,
      windspeed: currentWeather.windspeed,
      winddirection: currentWeather.winddirection,
      weathercode: currentWeather.weathercode,
      is_day: currentWeather.is_day,
      timestamp: new Date(currentWeather.time),
      timezone: data.timezone,
      timezone_abbreviation: data.timezone_abbreviation,
      elevation: data.elevation,
      weather_description: WEATHER_CODES[currentWeather.weathercode] || 'Unknown'
    };

    logger.info(`Weather data fetched successfully: ${processedData.temperature}°C`);
    return processedData;

  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('Error fetching weather data:', axiosError.message);
    throw new Error(`Failed to fetch weather data: ${axiosError.message}`);
  }
}

/**
 * Store weather data in database
 */
export async function storeWeatherData(
  data: ProcessedWeatherData
): Promise<IWeatherData> {
  try {
    const weatherData = new WeatherData({
      timestamp: data.timestamp,
      latitude: data.latitude,
      longitude: data.longitude,
      temperature: data.temperature,
      windspeed: data.windspeed,
      winddirection: data.winddirection,
      weathercode: data.weathercode,
      is_day: data.is_day,
      source: 'api',
      metadata: {
        timezone: data.timezone,
        timezone_abbreviation: data.timezone_abbreviation,
        elevation: data.elevation
      }
    });

    await weatherData.save();
    logger.info('Weather data stored in database');
    
    return weatherData;
  } catch (error) {
    logger.error('Error storing weather data:', error);
    throw error;
  }
}

/**
 * Fetch and store weather data, then broadcast to clients
 */
export async function fetchAndBroadcastWeather(
  latitude: number = DEFAULT_COORDS.latitude,
  longitude: number = DEFAULT_COORDS.longitude
): Promise<ProcessedWeatherData> {
  const weatherData = await fetchWeatherFromAPI(latitude, longitude);
  
  // Store in database
  await storeWeatherData(weatherData);
  
  // Broadcast to all connected WebSocket clients
  broadcastToClients('weather:update', weatherData);
  
  return weatherData;
}

/**
 * Get historical weather data from database
 */
export async function getHistoricalWeather(
  latitude: number,
  longitude: number,
  hours: number = 24
): Promise<IWeatherData[]> {
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - hours);

  return WeatherData.find({
    latitude: { $gte: latitude - 0.1, $lte: latitude + 0.1 },
    longitude: { $gte: longitude - 0.1, $lte: longitude + 0.1 },
    timestamp: { $gte: startTime }
  })
    .sort({ timestamp: -1 })
    .exec();
}

/**
 * Get weather description for a weather code
 */
export function getWeatherDescription(weathercode: number): string {
  return WEATHER_CODES[weathercode] || 'Unknown';
}
