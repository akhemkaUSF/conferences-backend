//users.test.js
const request = require('supertest');
import app from './index.js';

test('should return test ok', async () => {
  const response = await request(app).get('/test');
  console.log(response);
  expect(response.status).toBe(200);
  expect(response.body).toEqual("test ok");
});