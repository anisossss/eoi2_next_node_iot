/**
 * CSIR IoT Sensor Simulator
 * 
 * Simulates IoT sensor data and publishes to MQTT broker
 * Demonstrates real-time data updates using MQTT protocol
 */

import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// Configuration
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const SIMULATION_INTERVAL = parseInt(process.env.SIMULATION_INTERVAL || '5000', 10);

// MQTT Topics
const TOPICS = {
  SENSOR_DATA: 'csir/sensors',
  WEATHER_UPDATE: 'csir/weather/update',
  SYSTEM_STATUS: 'csir/system/status'
};

// Simulated Sensors Configuration
interface SensorConfig {
  sensorId: string;
  name: string;
  type: 'temperature' | 'humidity' | 'pressure' | 'wind' | 'combined';
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  baseValues: {
    temperature?: number;
    humidity?: number;
    pressure?: number;
    windspeed?: number;
    winddirection?: number;
  };
}

const SENSORS: SensorConfig[] = [
  {
    sensorId: 'SENSOR-PRETORIA-001',
    name: 'CSIR Pretoria Main Campus',
    type: 'combined',
    location: {
      latitude: -25.75,
      longitude: 28.19,
      name: 'Pretoria, Gauteng'
    },
    baseValues: {
      temperature: 25,
      humidity: 55,
      pressure: 1015,
      windspeed: 10,
      winddirection: 180
    }
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
    baseValues: {
      temperature: 22,
      humidity: 45
    }
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
    baseValues: {
      temperature: 20,
      humidity: 65,
      pressure: 1020,
      windspeed: 15,
      winddirection: 270
    }
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
    baseValues: {
      temperature: 28,
      humidity: 75
    }
  }
];

// MQTT Client
let client: MqttClient | null = null;

/**
 * Generate simulated sensor data with realistic variations
 */
function generateSensorData(sensor: SensorConfig): Record<string, number> {
  const data: Record<string, number> = {};
  const time = new Date();
  const hour = time.getHours();

  // Temperature varies with time of day
  if (sensor.baseValues.temperature !== undefined) {
    const tempVariation = Math.sin((hour - 6) * Math.PI / 12) * 5; // Peak at noon
    data.temperature = sensor.baseValues.temperature + tempVariation + (Math.random() - 0.5) * 2;
  }

  // Humidity inversely related to temperature
  if (sensor.baseValues.humidity !== undefined) {
    const humidityVariation = -Math.sin((hour - 6) * Math.PI / 12) * 10;
    data.humidity = Math.max(20, Math.min(95, 
      sensor.baseValues.humidity + humidityVariation + (Math.random() - 0.5) * 5
    ));
  }

  // Pressure with slow variations
  if (sensor.baseValues.pressure !== undefined) {
    data.pressure = sensor.baseValues.pressure + (Math.random() - 0.5) * 5;
  }

  // Wind speed with random gusts
  if (sensor.baseValues.windspeed !== undefined) {
    const gust = Math.random() > 0.8 ? Math.random() * 10 : 0;
    data.windspeed = Math.max(0, sensor.baseValues.windspeed + (Math.random() - 0.5) * 5 + gust);
  }

  // Wind direction with gradual changes
  if (sensor.baseValues.winddirection !== undefined) {
    data.winddirection = (sensor.baseValues.winddirection + (Math.random() - 0.5) * 30 + 360) % 360;
  }

  // Add battery and signal strength for realism
  data.battery = 85 + Math.random() * 15;
  data.signal_strength = -50 - Math.random() * 30;

  return data;
}

/**
 * Publish sensor data to MQTT broker
 */
function publishSensorData(sensor: SensorConfig): void {
  if (!client || !client.connected) {
    console.warn('MQTT client not connected');
    return;
  }

  const data = generateSensorData(sensor);
  const topic = `${TOPICS.SENSOR_DATA}/${sensor.sensorId}/data`;
  
  const message = {
    sensorId: sensor.sensorId,
    name: sensor.name,
    type: sensor.type,
    location: sensor.location,
    timestamp: new Date().toISOString(),
    data,
    messageId: uuidv4()
  };

  client.publish(topic, JSON.stringify(message), { qos: 1 }, (err) => {
    if (err) {
      console.error(`Error publishing to ${topic}:`, err);
    } else {
      console.log(`[${new Date().toISOString()}] Published: ${sensor.name} - Temp: ${data.temperature?.toFixed(1)}°C`);
    }
  });
}

/**
 * Publish weather update
 */
function publishWeatherUpdate(): void {
  if (!client || !client.connected) {
    return;
  }

  const weather = {
    latitude: -25.75,
    longitude: 28.19,
    temperature: 20 + Math.random() * 15,
    windspeed: 5 + Math.random() * 20,
    winddirection: Math.floor(Math.random() * 360),
    weathercode: [0, 1, 2, 3, 45, 51, 61, 80][Math.floor(Math.random() * 8)],
    is_day: new Date().getHours() >= 6 && new Date().getHours() < 18 ? 1 : 0,
    timestamp: new Date().toISOString()
  };

  client.publish(TOPICS.WEATHER_UPDATE, JSON.stringify(weather), { qos: 1 });
  console.log(`[${new Date().toISOString()}] Weather update published`);
}

/**
 * Connect to MQTT broker
 */
async function connect(): Promise<void> {
  return new Promise((resolve, reject) => {
    const options: IClientOptions = {
      clientId: `csir-iot-simulator-${Date.now()}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 5000,
      keepalive: 60
    };

    console.log(`Connecting to MQTT broker at ${MQTT_BROKER_URL}...`);
    client = mqtt.connect(MQTT_BROKER_URL, options);

    client.on('connect', () => {
      console.log('✅ Connected to MQTT broker');
      
      // Publish system status
      client!.publish(TOPICS.SYSTEM_STATUS, JSON.stringify({
        status: 'online',
        simulator: 'csir-iot-simulator',
        timestamp: new Date().toISOString(),
        sensors: SENSORS.map(s => s.sensorId)
      }), { qos: 1 });

      resolve();
    });

    client.on('error', (error) => {
      console.error('MQTT error:', error);
      reject(error);
    });

    client.on('close', () => {
      console.log('MQTT connection closed');
    });

    client.on('reconnect', () => {
      console.log('Reconnecting to MQTT broker...');
    });
  });
}

/**
 * Start simulation loop
 */
function startSimulation(): void {
  console.log(`\n🚀 Starting IoT simulation (interval: ${SIMULATION_INTERVAL}ms)`);
  console.log(`📡 Simulating ${SENSORS.length} sensors:\n`);
  
  SENSORS.forEach(sensor => {
    console.log(`  - ${sensor.sensorId}: ${sensor.name} (${sensor.type})`);
  });
  console.log('');

  // Initial data publish
  SENSORS.forEach(sensor => publishSensorData(sensor));

  // Regular simulation interval
  setInterval(() => {
    SENSORS.forEach(sensor => publishSensorData(sensor));
  }, SIMULATION_INTERVAL);

  // Weather updates every 30 seconds
  setInterval(() => {
    publishWeatherUpdate();
  }, 30000);
}

/**
 * Graceful shutdown
 */
function shutdown(): void {
  console.log('\n🛑 Shutting down simulator...');
  
  if (client) {
    client.publish(TOPICS.SYSTEM_STATUS, JSON.stringify({
      status: 'offline',
      simulator: 'csir-iot-simulator',
      timestamp: new Date().toISOString()
    }), { qos: 1 }, () => {
      client!.end(false, {}, () => {
        console.log('MQTT client disconnected');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════');
  console.log('        CSIR IoT Sensor Data Simulator');
  console.log('═══════════════════════════════════════════════════');
  console.log('Demonstrating MQTT protocol for IoT communication\n');

  try {
    await connect();
    startSimulation();
  } catch (error) {
    console.error('Failed to start simulator:', error);
    process.exit(1);
  }
}

main();
