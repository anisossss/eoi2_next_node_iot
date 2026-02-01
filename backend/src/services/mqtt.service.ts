/**
 * MQTT Service
 * Handles MQTT broker connections and message handling for IoT communication
 */

import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { logger } from '../config/logger';
import { IoTReading } from '../models';
import { broadcastToClients } from './websocket.service';

// MQTT Topics
export const MQTT_TOPICS = {
  SENSOR_DATA: 'csir/sensors/+/data',
  SENSOR_STATUS: 'csir/sensors/+/status',
  WEATHER_UPDATE: 'csir/weather/update',
  SYSTEM_ALERTS: 'csir/system/alerts'
} as const;

let mqttClient: MqttClient | null = null;

/**
 * Initialize MQTT client and connect to broker
 */
export async function initializeMQTT(): Promise<MqttClient> {
  return new Promise((resolve, reject) => {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    
    const options: IClientOptions = {
      clientId: `csir-backend-${Date.now()}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 5000,
      keepalive: 60
    };

    logger.info(`Connecting to MQTT broker at ${brokerUrl}`);
    mqttClient = mqtt.connect(brokerUrl, options);

    mqttClient.on('connect', () => {
      logger.info('Connected to MQTT broker');
      
      // Subscribe to topics
      if (mqttClient) {
        mqttClient.subscribe([
          MQTT_TOPICS.SENSOR_DATA,
          MQTT_TOPICS.SENSOR_STATUS,
          MQTT_TOPICS.WEATHER_UPDATE
        ], (err) => {
          if (err) {
            logger.error('MQTT subscription error:', err);
          } else {
            logger.info('Subscribed to MQTT topics');
          }
        });
      }
      
      resolve(mqttClient!);
    });

    mqttClient.on('message', handleMQTTMessage);

    mqttClient.on('error', (error) => {
      logger.error('MQTT error:', error);
      if (!mqttClient?.connected) {
        reject(error);
      }
    });

    mqttClient.on('close', () => {
      logger.warn('MQTT connection closed');
    });

    mqttClient.on('reconnect', () => {
      logger.info('Attempting to reconnect to MQTT broker...');
    });

    mqttClient.on('offline', () => {
      logger.warn('MQTT client is offline');
    });
  });
}

/**
 * Handle incoming MQTT messages
 */
async function handleMQTTMessage(topic: string, message: Buffer): Promise<void> {
  try {
    const payload = JSON.parse(message.toString());
    logger.debug(`MQTT message received on ${topic}:`, payload);

    // Extract sensor ID from topic (csir/sensors/{sensorId}/data)
    const topicParts = topic.split('/');
    
    if (topic.match(/csir\/sensors\/.*\/data/)) {
      const sensorId = topicParts[2];
      await handleSensorData(sensorId, payload);
    } else if (topic.match(/csir\/sensors\/.*\/status/)) {
      const sensorId = topicParts[2];
      await handleSensorStatus(sensorId, payload);
    } else if (topic === MQTT_TOPICS.WEATHER_UPDATE) {
      await handleWeatherUpdate(payload);
    }

  } catch (error) {
    logger.error('Error processing MQTT message:', error);
  }
}

/**
 * Handle sensor data messages
 */
async function handleSensorData(
  sensorId: string, 
  data: Record<string, unknown>
): Promise<void> {
  try {
    // Store reading in database
    const reading = new IoTReading({
      sensorId,
      timestamp: new Date(),
      data: {
        temperature: data.temperature,
        humidity: data.humidity,
        pressure: data.pressure,
        windspeed: data.windspeed,
        winddirection: data.winddirection,
        ...data
      },
      quality: 'good'
    });

    await reading.save();
    logger.debug(`Stored IoT reading for sensor ${sensorId}`);

    // Broadcast to WebSocket clients
    broadcastToClients('iot:reading', {
      sensorId,
      timestamp: reading.timestamp,
      data: reading.data
    });

  } catch (error) {
    logger.error(`Error handling sensor data for ${sensorId}:`, error);
  }
}

/**
 * Handle sensor status messages
 */
async function handleSensorStatus(
  sensorId: string, 
  status: Record<string, unknown>
): Promise<void> {
  logger.info(`Sensor ${sensorId} status update:`, status);
  
  // Broadcast status update to clients
  broadcastToClients('sensor:status', {
    sensorId,
    status,
    timestamp: new Date()
  });
}

/**
 * Handle weather update messages
 */
async function handleWeatherUpdate(data: Record<string, unknown>): Promise<void> {
  logger.info('Weather update received:', data);
  
  // Broadcast weather update to clients
  broadcastToClients('weather:update', {
    ...data,
    timestamp: new Date()
  });
}

/**
 * Publish message to MQTT topic
 */
export function publishMessage(
  topic: string, 
  message: Record<string, unknown>
): void {
  if (mqttClient && mqttClient.connected) {
    mqttClient.publish(topic, JSON.stringify(message), { qos: 1 }, (err) => {
      if (err) {
        logger.error(`Error publishing to ${topic}:`, err);
      } else {
        logger.debug(`Published to ${topic}`);
      }
    });
  } else {
    logger.warn('MQTT client not connected, cannot publish message');
  }
}

/**
 * Get MQTT client instance
 */
export function getMQTTClient(): MqttClient | null {
  return mqttClient;
}

/**
 * Disconnect MQTT client
 */
export async function disconnectMQTT(): Promise<void> {
  if (mqttClient) {
    return new Promise((resolve) => {
      mqttClient!.end(false, {}, () => {
        logger.info('MQTT client disconnected');
        resolve();
      });
    });
  }
}
