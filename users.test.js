//users.test.js
const request = require('supertest');
import app, {server} from './index.js';

test('should return test ok', async () => {
  const response = await request(app).get('/test');
  expect(response.status).toBe(200);
  expect(response.body).toEqual("test ok");
});

test('test console.log', () => {
    console.log("is this permission denied too");
});

afterAll(() => {
    server.close();
  });
