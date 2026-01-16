import { describe, it, expect, beforeAll } from 'vitest';

describe('Notifications Stream Authentication', () => {
  let token: string;

  beforeAll(async () => {
    // Login to get token
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
      }),
    });

    const loginData = await loginResponse.json();
    token = loginData.access_token;
    expect(token).toBeDefined();
  });

  it('should accept token via query parameter', async () => {
    const response = await fetch(
      `http://localhost:3000/api/notifications/stream?lastId=0&token=${encodeURIComponent(token)}`,
      {
        headers: {
          'Accept': 'text/event-stream',
        },
      }
    );

    // Should not return 401
    expect(response.status).not.toBe(401);
  });

  it('should reject without token', async () => {
    const response = await fetch(
      'http://localhost:3000/api/notifications/stream?lastId=0',
      {
        headers: {
          'Accept': 'text/event-stream',
        },
      }
    );

    // Should return 401 when no token provided
    expect(response.status).toBe(401);
  });
});