/**
 * Weather Service Tests
 * Tests for weather data fetching and processing
 */

import axios from 'axios';
import { 
  fetchWeatherFromAPI, 
  getWeatherDescription, 
  WEATHER_CODES 
} from '../../services/weather.service';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Weather Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchWeatherFromAPI', () => {
    it('should fetch weather data successfully', async () => {
      const mockResponse = {
        data: {
          latitude: -25.75,
          longitude: 28.19,
          timezone: 'Africa/Johannesburg',
          timezone_abbreviation: 'SAST',
          elevation: 1339,
          current_weather: {
            time: '2026-02-01T12:00',
            temperature: 28.5,
            windspeed: 12.3,
            winddirection: 180,
            weathercode: 1,
            is_day: 1
          }
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await fetchWeatherFromAPI(-25.75, 28.19);

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('temperature', 28.5);
      expect(result).toHaveProperty('windspeed', 12.3);
      expect(result).toHaveProperty('winddirection', 180);
      expect(result).toHaveProperty('weathercode', 1);
      expect(result).toHaveProperty('is_day', 1);
      expect(result).toHaveProperty('weather_description', 'Mainly clear');
    });

    it('should use default coordinates when not provided', async () => {
      const mockResponse = {
        data: {
          latitude: -25.75,
          longitude: 28.19,
          timezone: 'Africa/Johannesburg',
          timezone_abbreviation: 'SAST',
          elevation: 1339,
          current_weather: {
            time: '2026-02-01T12:00',
            temperature: 25,
            windspeed: 10,
            winddirection: 90,
            weathercode: 0,
            is_day: 1
          }
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await fetchWeatherFromAPI();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('latitude=-25.75'),
        expect.any(Object)
      );
    });

    it('should throw error when API call fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchWeatherFromAPI()).rejects.toThrow('Failed to fetch weather data');
    });
  });

  describe('getWeatherDescription', () => {
    it('should return correct description for known weather codes', () => {
      expect(getWeatherDescription(0)).toBe('Clear sky');
      expect(getWeatherDescription(1)).toBe('Mainly clear');
      expect(getWeatherDescription(2)).toBe('Partly cloudy');
      expect(getWeatherDescription(3)).toBe('Overcast');
      expect(getWeatherDescription(61)).toBe('Slight rain');
      expect(getWeatherDescription(95)).toBe('Thunderstorm');
    });

    it('should return "Unknown" for unknown weather codes', () => {
      expect(getWeatherDescription(999)).toBe('Unknown');
      expect(getWeatherDescription(-1)).toBe('Unknown');
    });
  });

  describe('WEATHER_CODES', () => {
    it('should have all standard weather codes defined', () => {
      const expectedCodes = [0, 1, 2, 3, 45, 48, 51, 53, 55, 61, 63, 65, 71, 73, 75, 80, 81, 82, 95, 96, 99];
      
      expectedCodes.forEach(code => {
        expect(WEATHER_CODES).toHaveProperty(code.toString());
        expect(typeof WEATHER_CODES[code]).toBe('string');
      });
    });
  });
});
