# CSIR IoT Weather Dashboard

## Expression of Interest (EOI) No. 8121/10/02/2026

### The Provision or Supply of Software Development Services to the CSIR

---

## Project Overview

A comprehensive, professional web application demonstrating modern software development capabilities for the CSIR (Council for Scientific and Industrial Research). This project showcases proficiency in:

- **Modern Web Development Stack**: Next.js, React, Node.js, Express.js, TypeScript
- **RESTful APIs**: Secure, well-documented API endpoints
- **IoT Communication Protocols**: MQTT integration for real-time data
- **Database Design**: MongoDB with optimized schemas
- **Containerization**: Full Docker support for all services
- **Testing**: Comprehensive unit and integration tests
- **Software Design**: Modular, scalable, and maintainable architecture

---

## Table of Contents

1. [Features](#features)
2. [Technical Stack](#technical-stack)
3. [Project Structure](#project-structure)
4. [Quick Start](#quick-start)
5. [Docker Deployment](#docker-deployment)
6. [API Documentation](#api-documentation)
7. [Architecture](#architecture)
8. [Testing](#testing)
9. [IoT Simulation](#iot-simulation)
10. [Screenshots](#screenshots)

---

## Features

### Frontend (Single Page Application)

- **Modern, Responsive UI**: Professional design optimized for desktop, tablet, and mobile
- **Grid View**: Visual dashboard with weather data and IoT sensor readings
- **Interactive Tree View**: Hierarchical data representation with expandable nodes
- **Real-time Updates**: Live data updates via WebSocket connections
- **Dark Mode Support**: Automatic theme switching based on system preferences

### Backend

- **RESTful API**: Full CRUD operations with proper HTTP methods
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin, User, and Viewer roles
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Protection against abuse
- **CORS Support**: Cross-origin request handling

### IoT Integration

- **MQTT Protocol**: Industry-standard IoT communication
- **Real-time Data**: WebSocket broadcasting of sensor data
- **Data Simulation**: Realistic IoT sensor data generation
- **Multiple Sensor Types**: Temperature, humidity, pressure, wind

### Data Persistence

- **MongoDB**: Document-based database for flexible data storage
- **Optimized Schemas**: Indexed collections for performance
- **Data Validation**: Schema-level validation rules

---

## Technical Stack

| Component            | Technology                                     |
| -------------------- | ---------------------------------------------- |
| **Frontend**         | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend**          | Node.js, Express.js, TypeScript                |
| **Database**         | MongoDB 7.0                                    |
| **Message Broker**   | Eclipse Mosquitto (MQTT)                       |
| **Real-time**        | Socket.IO, WebSockets                          |
| **Containerization** | Docker, Docker Compose                         |
| **Testing**          | Jest, React Testing Library, Supertest         |
| **External API**     | Open-Meteo Weather API                         |

---

## Project Structure

```
EIOO2/
├── docker-compose.yml          # Docker orchestration
├── README.md                   # This file
├── .gitignore
│
├── frontend/                   # Next.js Frontend Application
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── src/
│       ├── app/               # Next.js App Router
│       ├── components/        # React Components
│       │   ├── layout/       # Layout components
│       │   ├── ui/           # Reusable UI components
│       │   ├── views/        # Grid and Tree views
│       │   └── weather/      # Weather-specific components
│       ├── services/         # API and WebSocket services
│       ├── store/            # Zustand state management
│       ├── types/            # TypeScript definitions
│       ├── lib/              # Utility functions
│       └── __tests__/        # Frontend tests
│
├── backend/                    # Express.js Backend API
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts          # Entry point
│       ├── config/           # Configuration files
│       ├── models/           # MongoDB models
│       ├── routes/           # API routes
│       ├── services/         # Business logic
│       ├── middleware/       # Express middleware
│       └── __tests__/        # Backend tests
│
├── iot-simulator/              # IoT Data Simulator
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── index.ts          # MQTT publisher
│
├── mosquitto/                  # MQTT Broker Configuration
│   └── config/
│       └── mosquitto.conf
│
└── mongo-init/                 # MongoDB Initialization
    └── init-db.js
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Docker and Docker Compose (for containerized deployment)
- MongoDB (for local development without Docker)

### Local Development

**1. Clone the repository:**

```bash
git clone <repository-url>
cd EIOO2
```

**2. Install dependencies:**

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# IoT Simulator
cd ../iot-simulator
npm install
```

**3. Start MongoDB and MQTT broker:**

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0
docker run -d -p 1883:1883 -p 9001:9001 --name mosquitto eclipse-mosquitto:2.0
```

**4. Run the applications:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - IoT Simulator (optional)
cd iot-simulator
npm run dev
```

**5. Access the application:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- API Health: http://localhost:3001/api/health

---

## Docker Deployment

### Using Docker Compose (Recommended)

**1. Build and start all services:**

```bash
docker-compose up --build
```

**2. Access the services:**
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| MongoDB | localhost:27017 |
| MQTT Broker | localhost:1883 (TCP), localhost:9001 (WebSocket) |

**3. Stop all services:**

```bash
docker-compose down
```

---

## API Documentation

### Base URL

```
http://localhost:3001/api
```

### Endpoints

#### Health Check

| Method | Endpoint           | Description                |
| ------ | ------------------ | -------------------------- |
| GET    | `/health`          | Basic health check         |
| GET    | `/health/detailed` | Detailed service status    |
| GET    | `/health/ready`    | Kubernetes readiness probe |
| GET    | `/health/live`     | Kubernetes liveness probe  |

#### Weather

| Method | Endpoint              | Description                             |
| ------ | --------------------- | --------------------------------------- |
| GET    | `/weather/current`    | Get current weather from Open-Meteo API |
| GET    | `/weather/history`    | Get historical weather data             |
| GET    | `/weather/latest`     | Get latest weather readings             |
| GET    | `/weather/statistics` | Get weather statistics                  |
| GET    | `/weather/codes`      | Get weather code descriptions           |

#### Sensors

| Method | Endpoint                      | Description               |
| ------ | ----------------------------- | ------------------------- |
| GET    | `/sensors`                    | List all sensors          |
| GET    | `/sensors/:sensorId`          | Get sensor details        |
| POST   | `/sensors`                    | Create new sensor (Admin) |
| PUT    | `/sensors/:sensorId`          | Update sensor (Admin)     |
| DELETE | `/sensors/:sensorId`          | Delete sensor (Admin)     |
| GET    | `/sensors/:sensorId/readings` | Get sensor readings       |

#### IoT

| Method | Endpoint               | Description                    |
| ------ | ---------------------- | ------------------------------ |
| GET    | `/iot/readings`        | Get all IoT readings           |
| GET    | `/iot/readings/latest` | Get latest readings per sensor |
| POST   | `/iot/readings`        | Submit new reading             |
| POST   | `/iot/simulate`        | Trigger simulated data         |
| GET    | `/iot/status`          | Get IoT system status          |
| GET    | `/iot/tree`            | Get data in tree structure     |

#### Authentication

| Method | Endpoint         | Description              |
| ------ | ---------------- | ------------------------ |
| POST   | `/auth/register` | Register new user        |
| POST   | `/auth/login`    | Login and get tokens     |
| GET    | `/auth/me`       | Get current user profile |
| PUT    | `/auth/profile`  | Update profile           |
| PUT    | `/auth/password` | Change password          |
| POST   | `/auth/logout`   | Logout                   |

### Example API Requests

**Get Current Weather:**

```bash
curl http://localhost:3001/api/weather/current
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
    "weather_description": "Mainly clear"
  },
  "source": "open-meteo-api"
}
```

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CSIR IoT Dashboard                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────────┐ │
│  │   Frontend  │◄────►│   Backend   │◄────►│    MongoDB      │ │
│  │  (Next.js)  │      │ (Express.js)│      │   (Database)    │ │
│  └─────────────┘      └──────┬──────┘      └─────────────────┘ │
│         │                    │                                   │
│         │ WebSocket          │ MQTT                              │
│         │                    │                                   │
│         ▼                    ▼                                   │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────────┐ │
│  │  Real-time  │◄────►│ MQTT Broker │◄────►│ IoT Simulator   │ │
│  │   Updates   │      │ (Mosquitto) │      │ (Data Generator)│ │
│  └─────────────┘      └─────────────┘      └─────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│                    ┌─────────────────┐                          │
│                    │  Open-Meteo API │                          │
│                    │ (Weather Data)  │                          │
│                    └─────────────────┘                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Weather Data Flow:**
   - Frontend requests current weather → Backend API
   - Backend fetches from Open-Meteo API → Returns to Frontend
   - Data stored in MongoDB for historical tracking

2. **IoT Data Flow:**
   - IoT Simulator generates sensor data
   - Data published to MQTT Broker
   - Backend subscribes to MQTT topics
   - Backend broadcasts to Frontend via WebSocket
   - Data stored in MongoDB

3. **Real-time Updates:**
   - WebSocket connection maintained between Frontend and Backend
   - New data immediately pushed to all connected clients
   - Tree View and Grid View update automatically

---

## Testing

### Running Tests

**Backend Tests:**

```bash
cd backend
npm test                 # Run all tests
npm run test:coverage    # Run with coverage report
```

**Frontend Tests:**

```bash
cd frontend
npm test                 # Run all tests
npm run test:coverage    # Run with coverage report
```

### Test Coverage

The project includes tests for:

- API endpoint functionality
- Service layer business logic
- React component rendering
- Utility function correctness
- WebSocket connection handling

---

## IoT Simulation

The IoT Simulator generates realistic sensor data to demonstrate the system's real-time capabilities.

### Simulated Sensors

| Sensor ID           | Location         | Type        | Measurements                   |
| ------------------- | ---------------- | ----------- | ------------------------------ |
| SENSOR-PRETORIA-001 | CSIR Main Campus | Combined    | Temp, Humidity, Pressure, Wind |
| SENSOR-PRETORIA-002 | Research Lab A   | Temperature | Temp, Humidity                 |
| SENSOR-CPT-001      | Cape Town Office | Combined    | Temp, Humidity, Pressure, Wind |
| SENSOR-DBN-001      | Durban Facility  | Humidity    | Temp, Humidity                 |

### Data Characteristics

- Temperature varies with time of day (peak at noon)
- Humidity inversely related to temperature
- Wind includes random gusts
- All data includes realistic noise

---

## Environment Variables

### Backend

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/csir_iot_db
MQTT_BROKER_URL=mqtt://localhost:1883
JWT_SECRET=secure-secret-key
CORS_ORIGIN=http://localhost:3000
```

### Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### IoT Simulator

```env
MQTT_BROKER_URL=mqtt://localhost:1883
SIMULATION_INTERVAL=5000
```

---

## Security Features

- **JWT Authentication**: Secure token-based auth with expiration
- **Password Hashing**: bcrypt with 12 rounds
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: express-validator for all inputs
- **CORS Protection**: Configurable origins
- **Helmet**: Security headers for Express
- **Non-root Docker Users**: Enhanced container security

---

## License

This project is developed for CSIR EOI No. 8121/10/02/2026 submission.

---

## Acknowledgments

- **Open-Meteo**: Free weather API
- **CSIR**: Council for Scientific and Industrial Research
- **Eclipse Mosquitto**: MQTT broker
- **MongoDB**: Database platform
