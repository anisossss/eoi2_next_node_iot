/**
 * WeatherCard Component Tests
 */

import { render, screen } from '@testing-library/react';
import { WeatherCard } from '@/components/weather/WeatherCard';
import type { CurrentWeather } from '@/types';

const mockWeather: CurrentWeather = {
  latitude: -25.75,
  longitude: 28.19,
  temperature: 25.5,
  windspeed: 12.3,
  winddirection: 180,
  weathercode: 1,
  is_day: 1,
  timestamp: '2026-02-01T12:00:00Z',
  timezone: 'Africa/Johannesburg',
  timezone_abbreviation: 'SAST',
  elevation: 1339,
  weather_description: 'Mainly clear'
};

describe('WeatherCard', () => {
  it('renders weather data correctly', () => {
    render(<WeatherCard weather={mockWeather} />);
    
    // Check temperature is displayed
    expect(screen.getByText('26')).toBeInTheDocument(); // Rounded
    expect(screen.getByText('°C')).toBeInTheDocument();
    
    // Check weather description
    expect(screen.getByText('Mainly clear')).toBeInTheDocument();
    
    // Check location
    expect(screen.getByText('Pretoria, South Africa')).toBeInTheDocument();
  });

  it('displays wind speed correctly', () => {
    render(<WeatherCard weather={mockWeather} />);
    
    expect(screen.getByText('Wind Speed')).toBeInTheDocument();
    expect(screen.getByText('12.3 km/h')).toBeInTheDocument();
  });

  it('displays wind direction correctly', () => {
    render(<WeatherCard weather={mockWeather} />);
    
    expect(screen.getByText('Wind Direction')).toBeInTheDocument();
    expect(screen.getByText(/S \(180°\)/)).toBeInTheDocument();
  });

  it('displays elevation correctly', () => {
    render(<WeatherCard weather={mockWeather} />);
    
    expect(screen.getByText('Elevation')).toBeInTheDocument();
    expect(screen.getByText('1339 m')).toBeInTheDocument();
  });

  it('shows day indicator when is_day is 1', () => {
    render(<WeatherCard weather={mockWeather} />);
    
    expect(screen.getByText('Day')).toBeInTheDocument();
  });

  it('shows night indicator when is_day is 0', () => {
    const nightWeather = { ...mockWeather, is_day: 0 };
    render(<WeatherCard weather={nightWeather} />);
    
    expect(screen.getByText('Night')).toBeInTheDocument();
  });

  it('displays coordinates', () => {
    render(<WeatherCard weather={mockWeather} />);
    
    expect(screen.getByText(/Lat: -25.7500/)).toBeInTheDocument();
    expect(screen.getByText(/Lon: 28.1900/)).toBeInTheDocument();
  });
});
