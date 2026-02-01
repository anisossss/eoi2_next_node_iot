/**
 * Weather Data Model
 * MongoDB schema for weather data storage
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IWeatherData extends Document {
  timestamp: Date;
  latitude: number;
  longitude: number;
  temperature: number;
  windspeed?: number;
  winddirection?: number;
  weathercode?: number;
  is_day?: number;
  source: 'api' | 'iot' | 'simulation';
  metadata?: {
    timezone?: string;
    timezone_abbreviation?: string;
    elevation?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const weatherDataSchema = new Schema<IWeatherData>(
  {
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    temperature: {
      type: Number,
      required: true
    },
    windspeed: {
      type: Number,
      default: 0
    },
    winddirection: {
      type: Number,
      min: 0,
      max: 360,
      default: 0
    },
    weathercode: {
      type: Number,
      default: 0
    },
    is_day: {
      type: Number,
      enum: [0, 1],
      default: 1
    },
    source: {
      type: String,
      enum: ['api', 'iot', 'simulation'],
      required: true,
      default: 'api'
    },
    metadata: {
      timezone: String,
      timezone_abbreviation: String,
      elevation: Number
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound indexes for efficient queries
weatherDataSchema.index({ latitude: 1, longitude: 1 });
weatherDataSchema.index({ source: 1, timestamp: -1 });
weatherDataSchema.index({ createdAt: -1 });

// Static method to get latest weather for a location
weatherDataSchema.statics.getLatestByLocation = async function(
  lat: number,
  lon: number,
  tolerance: number = 0.1
) {
  return this.findOne({
    latitude: { $gte: lat - tolerance, $lte: lat + tolerance },
    longitude: { $gte: lon - tolerance, $lte: lon + tolerance }
  }).sort({ timestamp: -1 });
};

export const WeatherData = mongoose.model<IWeatherData>('WeatherData', weatherDataSchema);
