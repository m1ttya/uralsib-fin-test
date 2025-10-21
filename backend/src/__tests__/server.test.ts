import request from 'supertest';
import { app } from '../server';

describe('GET /api/tests', () => {
    it('should return a list of available tests', async () => {
        const response = await request(app).get('/api/tests');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('tests');
        expect(Array.isArray(response.body.tests)).toBe(true);
    });
});
