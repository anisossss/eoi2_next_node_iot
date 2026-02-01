# CSIR IoT Dashboard - Architecture Documentation

## EOI No. 8121/10/02/2026

---

## 1. System Overview

The CSIR IoT Weather Dashboard is a modern, full-stack web application designed to demonstrate proficiency in software development for the CSIR Expression of Interest.

### 1.1 Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Microservices Architecture** | Scalable, maintainable, independently deployable |
| **Event-Driven Communication** | Real-time updates, loose coupling |
| **RESTful APIs** | Industry standard, well-documented |
| **Container-First Design** | Consistent environments, easy deployment |
| **TypeScript Throughout** | Type safety, better developer experience |

---

## 2. Component Architecture

### 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        Web Browser (SPA)                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │  Grid View   │  │  Tree View   │  │   Header     │                 │ │
│  │  │  Component   │  │  Component   │  │   Component  │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  │                           │                                             │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │              Zustand Store (State Management)                    │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  │                    │                      │                            │ │
│  │             API Service           WebSocket Service                    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                              │                     │
                         HTTP/REST            WebSocket
                              │                     │
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY LAYER                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    Express.js Backend Server                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │  Routes      │  │  Middleware  │  │  Controllers │                 │ │
│  │  │  - Weather   │  │  - Auth      │  │  - Weather   │                 │ │
│  │  │  - Sensors   │  │  - Validation│  │  - Sensors   │                 │ │
│  │  │  - IoT       │  │  - Error     │  │  - IoT       │                 │ │
│  │  │  - Auth      │  │  - Rate Limit│  │  - Auth      │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  │                           │                                             │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Service Layer                                 │  │ │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                │  │ │
│  │  │  │  Weather   │  │    MQTT    │  │ WebSocket  │                │  │ │
│  │  │  │  Service   │  │  Service   │  │  Service   │                │  │ │
│  │  │  └────────────┘  └────────────┘  └────────────┘                │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                    │              │                    │
                    │              │                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────────┐│
│  │    MongoDB     │  │ MQTT Broker    │  │     External APIs              ││
│  │   ┌────────┐   │  │  (Mosquitto)   │  │  ┌──────────────────────────┐ ││
│  │   │Weather │   │  │                │  │  │     Open-Meteo API       │ ││
│  │   │Sensors │   │  │  Topics:       │  │  │   (Weather Data)         │ ││
│  │   │Readings│   │  │  - csir/sensors│  │  └──────────────────────────┘ ││
│  │   │Users   │   │  │  - csir/weather│  │                                ││
│  │   └────────┘   │  │  - csir/system │  │                                ││
│  └────────────────┘  └────────────────┘  └────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────────────────────┐
│                       IOT SIMULATION LAYER                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      IoT Simulator                                      │ │
│  │   Generates realistic sensor data and publishes to MQTT broker          │ │
│  │   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │ │
│  │   │ Pretoria   │  │ Pretoria   │  │ Cape Town  │  │  Durban    │     │ │
│  │   │ Sensor 001 │  │ Sensor 002 │  │ Sensor 001 │  │ Sensor 001 │     │ │
│  │   └────────────┘  └────────────┘  └────────────┘  └────────────┘     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Models

### 3.1 Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│      Sensors        │       │    IoT Readings     │
├─────────────────────┤       ├─────────────────────┤
│ sensorId (PK)       │───────│ sensorId (FK)       │
│ name                │  1:N  │ timestamp           │
│ type                │       │ data                │
│ location            │       │ quality             │
│ isActive            │       │ isAnomaly           │
│ lastReading         │       │ createdAt           │
│ configuration       │       └─────────────────────┘
│ createdAt           │
└─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│    Weather Data     │       │       Users         │
├─────────────────────┤       ├─────────────────────┤
│ _id (PK)            │       │ _id (PK)            │
│ timestamp           │       │ username            │
│ latitude            │       │ email               │
│ longitude           │       │ password (hashed)   │
│ temperature         │       │ role                │
│ windspeed           │       │ isActive            │
│ winddirection       │       │ lastLogin           │
│ weathercode         │       │ createdAt           │
│ is_day              │       └─────────────────────┘
│ source              │
│ metadata            │
└─────────────────────┘
```

### 3.2 MongoDB Collections

| Collection | Purpose | Indexes |
|------------|---------|---------|
| `weather_data` | Store weather readings | timestamp, location, source |
| `iot_sensors` | Sensor configuration | sensorId (unique), type, isActive |
| `iot_readings` | Sensor data readings | sensorId + timestamp, timestamp |
| `users` | User authentication | username (unique), email (unique) |

---

## 4. API Design

### 4.1 RESTful API Structure

```
/api
├── /health
│   ├── GET /              # Basic health check
│   ├── GET /detailed      # Detailed status
│   ├── GET /ready         # Readiness probe
│   └── GET /live          # Liveness probe
│
├── /weather
│   ├── GET /current       # Current weather from API
│   ├── GET /history       # Historical data
│   ├── GET /latest        # Latest readings
│   ├── GET /statistics    # Aggregated stats
│   └── GET /codes         # Weather code descriptions
│
├── /sensors
│   ├── GET /              # List all sensors
│   ├── GET /:sensorId     # Get single sensor
│   ├── POST /             # Create sensor (auth)
│   ├── PUT /:sensorId     # Update sensor (auth)
│   ├── DELETE /:sensorId  # Delete sensor (auth)
│   ├── GET /:sensorId/readings    # Sensor readings
│   └── GET /:sensorId/statistics  # Sensor stats
│
├── /iot
│   ├── GET /readings      # All IoT readings
│   ├── GET /readings/latest # Latest per sensor
│   ├── POST /readings     # Submit reading
│   ├── POST /simulate     # Trigger simulation
│   ├── GET /status        # System status
│   └── GET /tree          # Tree structure data
│
└── /auth
    ├── POST /register     # User registration
    ├── POST /login        # User login
    ├── GET /me            # Current user
    ├── PUT /profile       # Update profile
    ├── PUT /password      # Change password
    └── POST /logout       # Logout
```

---

## 5. Real-Time Communication

### 5.1 WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connected` | Server → Client | Connection confirmed |
| `iot:reading` | Server → Client | New sensor reading |
| `weather:update` | Server → Client | Weather data update |
| `sensor:status` | Server → Client | Sensor status change |
| `subscribe:sensor` | Client → Server | Subscribe to sensor |
| `subscribe:weather` | Client → Server | Subscribe to weather |
| `subscribe:all` | Client → Server | Subscribe to all updates |

### 5.2 MQTT Topics

```
csir/
├── sensors/
│   └── {sensorId}/
│       ├── data           # Sensor readings
│       └── status         # Sensor status
├── weather/
│   └── update             # Weather updates
└── system/
    ├── status             # System status
    └── alerts             # System alerts
```

---

## 6. Security Architecture

### 6.1 Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Client  │     │   API   │     │  Auth   │     │Database │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ POST /login   │               │               │
     │──────────────>│               │               │
     │               │ Validate      │               │
     │               │──────────────>│               │
     │               │               │ Check User    │
     │               │               │──────────────>│
     │               │               │<──────────────│
     │               │               │ Compare Hash  │
     │               │<──────────────│               │
     │               │ Generate JWT  │               │
     │<──────────────│               │               │
     │ JWT Token     │               │               │
     │               │               │               │
     │ GET /api/...  │               │               │
     │ (with token)  │               │               │
     │──────────────>│               │               │
     │               │ Verify JWT    │               │
     │               │──────────────>│               │
     │               │<──────────────│               │
     │               │               │               │
     │<──────────────│ Response      │               │
     │               │               │               │
```

### 6.2 Security Layers

1. **Transport Layer**: HTTPS/WSS encryption
2. **Authentication**: JWT tokens with expiration
3. **Authorization**: Role-based access control
4. **Validation**: Input sanitization and validation
5. **Rate Limiting**: Request throttling per IP
6. **Headers**: Helmet security headers

---

## 7. Deployment Architecture

### 7.1 Docker Container Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Docker Network (csir-network)                │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Frontend   │  │   Backend    │  │   MongoDB    │         │
│  │  Container   │  │  Container   │  │  Container   │         │
│  │              │  │              │  │              │         │
│  │  Port: 3000  │  │  Port: 3001  │  │ Port: 27017  │         │
│  │              │  │              │  │              │         │
│  │  Next.js     │  │  Express.js  │  │   mongo:7.0  │         │
│  │  Node 20     │  │  Node 20     │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ MQTT Broker  │  │IoT Simulator │                            │
│  │  Container   │  │  Container   │                            │
│  │              │  │              │                            │
│  │ Port: 1883   │  │  (internal)  │                            │
│  │ Port: 9001   │  │              │                            │
│  │              │  │  Node 20     │                            │
│  │ Mosquitto    │  │              │                            │
│  └──────────────┘  └──────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Container Resource Allocation

| Service | CPU | Memory | Replicas |
|---------|-----|--------|----------|
| Frontend | 0.5 | 512MB | 1 |
| Backend | 1.0 | 1GB | 1 |
| MongoDB | 1.0 | 2GB | 1 |
| MQTT Broker | 0.25 | 256MB | 1 |
| IoT Simulator | 0.25 | 256MB | 1 |

---

## 8. Scalability Considerations

### 8.1 Horizontal Scaling Strategy

1. **Frontend**: Deploy behind load balancer, stateless design
2. **Backend**: Multiple instances with shared MongoDB
3. **MongoDB**: Replica set for high availability
4. **MQTT**: Cluster mode with shared subscriptions

### 8.2 Performance Optimizations

- Database indexes on frequently queried fields
- Connection pooling for MongoDB
- Response caching for static data
- Lazy loading of frontend components
- WebSocket connection management

---

## 9. Monitoring & Logging

### 9.1 Logging Strategy

| Level | Use Case |
|-------|----------|
| ERROR | Application errors, exceptions |
| WARN | Degraded functionality, retries |
| INFO | Request logging, business events |
| DEBUG | Detailed debugging information |

### 9.2 Health Monitoring

- `/api/health/ready` - Kubernetes readiness probe
- `/api/health/live` - Kubernetes liveness probe
- `/api/health/detailed` - Service status dashboard

---

## 10. Technology Justification

| Technology | Justification |
|------------|---------------|
| **Next.js** | Server-side rendering, excellent DX, React-based |
| **Express.js** | Lightweight, flexible, widely adopted |
| **MongoDB** | Document-based, flexible schema, scalable |
| **MQTT** | Industry standard for IoT, lightweight |
| **Docker** | Consistent environments, easy deployment |
| **TypeScript** | Type safety, better maintainability |
| **Socket.IO** | Reliable WebSocket with fallbacks |
| **Zustand** | Lightweight state management |

---

*Document Version: 1.0*  
*Last Updated: February 2026*  
*EOI Reference: 8121/10/02/2026*
