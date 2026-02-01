# CSIR IoT Dashboard - API Documentation

## EOI No. 8121/10/02/2026

---

## Base URL

```
http://localhost:3001/api
```

## Authentication

Most endpoints are public. Protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Health Endpoints

### GET /health

Basic health check endpoint.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "service": "CSIR IoT Backend API",
  "version": "1.0.0",
  "timestamp": "2026-02-01T12:00:00.000Z"
}
```

### GET /health/detailed

Detailed health check with service status.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "service": "CSIR IoT Backend API",
  "version": "1.0.0",
  "timestamp": "2026-02-01T12:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": "45 MB",
    "total": "128 MB"
  },
  "services": {
    "mongodb": {
      "status": "connected",
      "connected": true
    },
    "mqtt": {
      "status": "connected",
      "connected": true
    },
    "websocket": {
      "status": "running",
      "connectedClients": 5
    }
  }
}
```

---

## Weather Endpoints

### GET /weather/current

Fetch current weather from Open-Meteo API.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| latitude | number | -25.75 | Latitude coordinate |
| longitude | number | 28.19 | Longitude coordinate |

**Example:**
```bash
curl "http://localhost:3001/api/weather/current?latitude=-25.75&longitude=28.19"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "latitude": -25.75,
    "longitude": 28.19,
    "temperature": 28.5,
    "windspeed": 12.3,
    "winddirection": 180,
    "weathercode": 1,
    "is_day": 1,
    "timestamp": "2026-02-01T12:00:00Z",
    "timezone": "Africa/Johannesburg",
    "timezone_abbreviation": "SAST",
    "elevation": 1339,
    "weather_description": "Mainly clear"
  },
  "source": "open-meteo-api",
  "timestamp": "2026-02-01T12:00:00.000Z"
}
```

### GET /weather/history

Get historical weather data from database.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| latitude | number | -25.75 | Latitude coordinate |
| longitude | number | 28.19 | Longitude coordinate |
| hours | number | 24 | Hours of history |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "65abc123...",
      "timestamp": "2026-02-01T11:00:00Z",
      "latitude": -25.75,
      "longitude": 28.19,
      "temperature": 27.2,
      "windspeed": 10.5,
      "source": "api"
    }
  ],
  "count": 24,
  "query": {
    "latitude": -25.75,
    "longitude": 28.19,
    "hours": 24
  }
}
```

### GET /weather/codes

Get weather code descriptions.

**Response:**
```json
{
  "success": true,
  "data": [
    { "code": 0, "description": "Clear sky" },
    { "code": 1, "description": "Mainly clear" },
    { "code": 2, "description": "Partly cloudy" },
    { "code": 3, "description": "Overcast" }
  ]
}
```

---

## Sensor Endpoints

### GET /sensors

List all sensors with pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| type | string | - | Filter by sensor type |
| isActive | boolean | - | Filter by active status |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "65abc123...",
      "sensorId": "SENSOR-PRETORIA-001",
      "name": "CSIR Pretoria Main Campus",
      "type": "combined",
      "location": {
        "latitude": -25.75,
        "longitude": 28.19,
        "name": "Pretoria, Gauteng"
      },
      "isActive": true,
      "lastReading": "2026-02-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 4,
    "pages": 1
  }
}
```

### GET /sensors/:sensorId

Get a single sensor with latest reading.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "65abc123...",
    "sensorId": "SENSOR-PRETORIA-001",
    "name": "CSIR Pretoria Main Campus",
    "type": "combined",
    "location": {
      "latitude": -25.75,
      "longitude": 28.19,
      "name": "Pretoria, Gauteng"
    },
    "isActive": true,
    "latestReading": {
      "temperature": 28.5,
      "humidity": 55,
      "pressure": 1015
    },
    "latestReadingTime": "2026-02-01T12:00:00Z"
  }
}
```

### POST /sensors

Create a new sensor. **Requires Admin role.**

**Request Body:**
```json
{
  "sensorId": "SENSOR-JHB-001",
  "name": "Johannesburg Office",
  "type": "temperature",
  "location": {
    "latitude": -26.2041,
    "longitude": 28.0473,
    "name": "Johannesburg, Gauteng"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sensor created successfully",
  "data": {
    "id": "65abc456...",
    "sensorId": "SENSOR-JHB-001",
    "name": "Johannesburg Office",
    "type": "temperature",
    "location": {
      "latitude": -26.2041,
      "longitude": 28.0473,
      "name": "Johannesburg, Gauteng"
    },
    "isActive": true
  }
}
```

### GET /sensors/:sensorId/readings

Get readings for a specific sensor.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 50 | Items per page |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "65abc789...",
      "sensorId": "SENSOR-PRETORIA-001",
      "timestamp": "2026-02-01T12:00:00Z",
      "data": {
        "temperature": 28.5,
        "humidity": 55,
        "pressure": 1015
      },
      "quality": "good"
    }
  ],
  "sensor": {
    "sensorId": "SENSOR-PRETORIA-001",
    "name": "CSIR Pretoria Main Campus",
    "type": "combined"
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

---

## IoT Endpoints

### GET /iot/readings/latest

Get the latest reading for each sensor.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "65abc789...",
      "sensorId": "SENSOR-PRETORIA-001",
      "timestamp": "2026-02-01T12:00:00Z",
      "data": {
        "temperature": 28.5,
        "humidity": 55,
        "pressure": 1015,
        "windspeed": 12.3
      },
      "quality": "good",
      "sensor": {
        "name": "CSIR Pretoria Main Campus",
        "type": "combined",
        "location": {
          "name": "Pretoria, Gauteng"
        }
      }
    }
  ],
  "count": 4
}
```

### POST /iot/readings

Submit a new IoT reading.

**Request Body:**
```json
{
  "sensorId": "SENSOR-PRETORIA-001",
  "data": {
    "temperature": 29.0,
    "humidity": 52,
    "pressure": 1016
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reading recorded successfully",
  "data": {
    "id": "65abc999...",
    "sensorId": "SENSOR-PRETORIA-001",
    "timestamp": "2026-02-01T12:05:00Z",
    "data": {
      "temperature": 29.0,
      "humidity": 52,
      "pressure": 1016
    },
    "quality": "good"
  }
}
```

### POST /iot/simulate

Trigger simulated IoT data broadcast.

**Request Body (optional):**
```json
{
  "sensorId": "SENSOR-PRETORIA-001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Simulated data broadcasted",
  "data": {
    "reading": {
      "id": "65abcabc...",
      "sensorId": "SENSOR-PRETORIA-001",
      "timestamp": "2026-02-01T12:05:00Z",
      "data": {
        "temperature": 27.8,
        "humidity": 54,
        "pressure": 1014
      }
    },
    "sensor": {
      "sensorId": "SENSOR-PRETORIA-001",
      "name": "CSIR Pretoria Main Campus"
    }
  }
}
```

### GET /iot/tree

Get IoT data in tree structure for Tree View display.

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "CSIR IoT Network",
    "type": "root",
    "children": [
      {
        "name": "CSIR Pretoria Main Campus",
        "type": "sensor",
        "sensorId": "SENSOR-PRETORIA-001",
        "sensorType": "combined",
        "isActive": true,
        "location": {
          "latitude": -25.75,
          "longitude": 28.19,
          "name": "Pretoria, Gauteng"
        },
        "children": [
          {
            "name": "Latest Reading",
            "type": "reading",
            "timestamp": "2026-02-01T12:00:00Z",
            "children": [
              {
                "name": "temperature",
                "type": "data",
                "value": "28.50",
                "unit": "°C"
              },
              {
                "name": "humidity",
                "type": "data",
                "value": "55.00",
                "unit": "%"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## Authentication Endpoints

### POST /auth/register

Register a new user.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "65abcdef...",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": "24h"
    }
  }
}
```

### POST /auth/login

Login and receive tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "65abcdef...",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": "24h"
    }
  }
}
```

### GET /auth/me

Get current user profile. **Requires authentication.**

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "65abcdef...",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "lastLogin": "2026-02-01T12:00:00Z",
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate entry |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

---

*Document Version: 1.0*  
*Last Updated: February 2026*
