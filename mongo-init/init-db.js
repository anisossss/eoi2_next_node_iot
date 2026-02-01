// MongoDB Initialization Script for CSIR IoT Application
// This script creates the database, collections, and sample data

// Switch to the application database
db = db.getSiblingDB('csir_iot_db');

// Create collections with validation schemas
db.createCollection('weather_data', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['timestamp', 'latitude', 'longitude', 'temperature', 'source'],
      properties: {
        timestamp: {
          bsonType: 'date',
          description: 'Timestamp of the weather reading'
        },
        latitude: {
          bsonType: 'double',
          description: 'Latitude coordinate'
        },
        longitude: {
          bsonType: 'double',
          description: 'Longitude coordinate'
        },
        temperature: {
          bsonType: 'double',
          description: 'Temperature in Celsius'
        },
        windspeed: {
          bsonType: 'double',
          description: 'Wind speed in km/h'
        },
        winddirection: {
          bsonType: 'double',
          description: 'Wind direction in degrees'
        },
        weathercode: {
          bsonType: 'int',
          description: 'WMO weather code'
        },
        is_day: {
          bsonType: 'int',
          description: '1 for day, 0 for night'
        },
        source: {
          bsonType: 'string',
          description: 'Data source (api/iot/simulation)'
        }
      }
    }
  }
});

db.createCollection('iot_sensors', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['sensorId', 'name', 'type', 'location', 'isActive'],
      properties: {
        sensorId: {
          bsonType: 'string',
          description: 'Unique sensor identifier'
        },
        name: {
          bsonType: 'string',
          description: 'Human-readable sensor name'
        },
        type: {
          bsonType: 'string',
          enum: ['temperature', 'humidity', 'pressure', 'wind', 'combined'],
          description: 'Type of sensor'
        },
        location: {
          bsonType: 'object',
          required: ['latitude', 'longitude', 'name'],
          properties: {
            latitude: { bsonType: 'double' },
            longitude: { bsonType: 'double' },
            name: { bsonType: 'string' }
          }
        },
        isActive: {
          bsonType: 'bool',
          description: 'Whether the sensor is currently active'
        },
        lastReading: {
          bsonType: 'date',
          description: 'Timestamp of last reading'
        }
      }
    }
  }
});

db.createCollection('iot_readings', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['sensorId', 'timestamp', 'data'],
      properties: {
        sensorId: {
          bsonType: 'string',
          description: 'Reference to sensor'
        },
        timestamp: {
          bsonType: 'date',
          description: 'Reading timestamp'
        },
        data: {
          bsonType: 'object',
          description: 'Sensor reading data'
        }
      }
    }
  }
});

db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'password', 'role'],
      properties: {
        username: {
          bsonType: 'string',
          description: 'Unique username'
        },
        email: {
          bsonType: 'string',
          description: 'User email address'
        },
        password: {
          bsonType: 'string',
          description: 'Hashed password'
        },
        role: {
          bsonType: 'string',
          enum: ['admin', 'user', 'viewer'],
          description: 'User role'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Account creation date'
        }
      }
    }
  }
});

// Create indexes for optimal performance
db.weather_data.createIndex({ timestamp: -1 });
db.weather_data.createIndex({ latitude: 1, longitude: 1 });
db.weather_data.createIndex({ source: 1, timestamp: -1 });

db.iot_sensors.createIndex({ sensorId: 1 }, { unique: true });
db.iot_sensors.createIndex({ type: 1 });
db.iot_sensors.createIndex({ isActive: 1 });

db.iot_readings.createIndex({ sensorId: 1, timestamp: -1 });
db.iot_readings.createIndex({ timestamp: -1 });

db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });

// Insert sample IoT sensors
db.iot_sensors.insertMany([
  {
    sensorId: 'SENSOR-PRETORIA-001',
    name: 'CSIR Pretoria Main Campus',
    type: 'combined',
    location: {
      latitude: -25.75,
      longitude: 28.19,
      name: 'Pretoria, Gauteng'
    },
    isActive: true,
    lastReading: new Date()
  },
  {
    sensorId: 'SENSOR-PRETORIA-002',
    name: 'CSIR Research Lab A',
    type: 'temperature',
    location: {
      latitude: -25.7512,
      longitude: 28.1923,
      name: 'Pretoria Research Park'
    },
    isActive: true,
    lastReading: new Date()
  },
  {
    sensorId: 'SENSOR-CPT-001',
    name: 'CSIR Cape Town Office',
    type: 'combined',
    location: {
      latitude: -33.9249,
      longitude: 18.4241,
      name: 'Cape Town, Western Cape'
    },
    isActive: true,
    lastReading: new Date()
  },
  {
    sensorId: 'SENSOR-DBN-001',
    name: 'CSIR Durban Facility',
    type: 'humidity',
    location: {
      latitude: -29.8587,
      longitude: 31.0218,
      name: 'Durban, KwaZulu-Natal'
    },
    isActive: true,
    lastReading: new Date()
  }
]);

// Insert sample weather data
const now = new Date();
for (let i = 0; i < 24; i++) {
  const timestamp = new Date(now.getTime() - i * 3600000);
  db.weather_data.insertOne({
    timestamp: timestamp,
    latitude: -25.75,
    longitude: 28.19,
    temperature: 20 + Math.random() * 10,
    windspeed: 5 + Math.random() * 15,
    winddirection: Math.floor(Math.random() * 360),
    weathercode: [0, 1, 2, 3, 45, 48, 51, 53, 55][Math.floor(Math.random() * 9)],
    is_day: timestamp.getHours() >= 6 && timestamp.getHours() < 18 ? 1 : 0,
    source: 'simulation'
  });
}

print('CSIR IoT Database initialized successfully!');
print('Collections created: weather_data, iot_sensors, iot_readings, users');
print('Sample data inserted.');
