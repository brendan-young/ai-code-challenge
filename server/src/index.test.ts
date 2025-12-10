import request from 'supertest';
import { describe, expect, test, vi, beforeAll, afterAll } from 'vitest';
import { app } from './index';

describe('health + rules endpoints', () => {
	let server: any;

	beforeAll(() => {
		server = app;
	});

	afterAll(() => {
		vi.restoreAllMocks();
	});

	test('GET /health returns ok', async () => {
		const res = await request(server).get('/health');
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ status: 'ok' });
	});

	test('GET /api/rules returns a list', async () => {
		const res = await request(server).get('/api/rules');
		expect(res.status).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);
	});
});
