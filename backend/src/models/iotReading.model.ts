/**
 * IoT Reading Model
 * MongoDB schema for storing IoT sensor readings
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IIoTReadingData {
  temperature?: number;
  humidity?: number;
  pressure?: number;
  windspeed?: number;
  winddirection?: number;
  battery?: number;
  signal_strength?: number;
  [key: string]: unknown;
}

export interface IIoTReading extends Document {
  sensorId: string;
  timestamp: Date;
  data: IIoTReadingData;
  quality?: 'good' | 'fair' | 'poor';
  isAnomaly?: boolean;
  rawValue?: string;
  createdAt: Date;
  updatedAt: Date;
}

const iotReadingSchema = new Schema<IIoTReading>(
  {
    sensorId: {
      type: String,
      required: true,
      index: true,
      ref: 'Sensor'
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
      default: Date.now
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function(v: IIoTReadingData) {
          return v && typeof v === 'object' && Object.keys(v).length > 0;
        },
        message: 'Data must be a non-empty object'
      }
    },
    quality: {
      type: String,
      enum: ['good', 'fair', 'poor'],
      default: 'good'
    },
    isAnomaly: {
      type: Boolean,
      default: false
    },
    rawValue: {
      type: String
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

// Compound indexes for efficient time-series queries
iotReadingSchema.index({ sensorId: 1, timestamp: -1 });
iotReadingSchema.index({ timestamp: -1 });
iotReadingSchema.index({ sensorId: 1, isAnomaly: 1, timestamp: -1 });

// TTL index to automatically remove old data (optional - 30 days)
// iotReadingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Static method to get readings within a time range
iotReadingSchema.statics.getReadingsByTimeRange = async function(
  sensorId: string,
  startTime: Date,
  endTime: Date,
  limit: number = 100
): Promise<IIoTReading[]> {
  return this.find({
    sensorId,
    timestamp: {
      $gte: startTime,
      $lte: endTime
    }
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
};

// Static method to get latest reading for a sensor
iotReadingSchema.statics.getLatestReading = async function(
  sensorId: string
): Promise<IIoTReading | null> {
  return this.findOne({ sensorId })
    .sort({ timestamp: -1 })
    .exec();
};

// Static method to get aggregated statistics
iotReadingSchema.statics.getStatistics = async function(
  sensorId: string,
  field: string,
  startTime: Date,
  endTime: Date
) {
  return this.aggregate([
    {
      $match: {
        sensorId,
        timestamp: { $gte: startTime, $lte: endTime }
      }
    },
    {
      $group: {
        _id: null,
        avg: { $avg: `$data.${field}` },
        min: { $min: `$data.${field}` },
        max: { $max: `$data.${field}` },
        count: { $sum: 1 }
      }
    }
  ]);
};

export const IoTReading = mongoose.model<IIoTReading>('IoTReading', iotReadingSchema);
