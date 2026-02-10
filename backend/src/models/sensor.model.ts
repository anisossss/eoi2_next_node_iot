/**
 * IoT Sensor Model
 * MongoDB schema for IoT sensor management
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ISensorLocation {
  latitude: number;
  longitude: number;
  name: string;
  altitude?: number;
}

export interface ISensor extends Document {
  sensorId: string;
  name: string;
  type: 'temperature' | 'humidity' | 'pressure' | 'wind' | 'combined';
  location: ISensorLocation;
  isActive: boolean;
  lastReading?: Date;
  configuration?: {
    readingInterval?: number; // in milliseconds
    thresholds?: {
      min?: number;
      max?: number;
    };
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const sensorLocationSchema = new Schema<ISensorLocation>(
  {
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
    name: {
      type: String,
      required: true,
      trim: true
    },
    altitude: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const sensorSchema = new Schema<ISensor>(
  {
    sensorId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    type: {
      type: String,
      enum: ['temperature', 'humidity', 'pressure', 'wind', 'combined'],
      required: true
    },
    location: {
      type: sensorLocationSchema,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    lastReading: {
      type: Date
    },
    configuration: {
      readingInterval: {
        type: Number,
        default: 5000 // 5 seconds
      },
      thresholds: {
        min: Number,
        max: Number
      }
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
sensorSchema.index({ type: 1, isActive: 1 });
sensorSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

// Update lastReading timestamp
sensorSchema.methods.updateLastReading = async function(): Promise<void> {
  this.lastReading = new Date();
  await this.save();
};

export const Sensor = mongoose.model<ISensor>('Sensor', sensorSchema);
