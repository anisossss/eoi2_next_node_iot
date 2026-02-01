/**
 * Health API Tests
 * Tests for health check endpoints
 */

import request from 'supertest';
import express from 'express';
import healthRoutes from '../../routes/health.routes';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/health', healthRoutes);

describe('Health API', () => {
  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'CSIR IoT Backend API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/health/live', () => {
    it('should return alive status for liveness probe', async () => {
      const response = await request(app)
        .get('/api/health/live')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status', 'alive');
    });
  });
});
