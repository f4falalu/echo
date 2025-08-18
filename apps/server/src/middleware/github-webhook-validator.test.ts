import { InstallationCallbackSchema } from '@buster/server-shared/github';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { githubWebhookValidator } from './github-webhook-validator';

// Mock the verify webhook signature service
vi.mock('../api/v2/github/services/verify-webhook-signature', () => ({
  verifyGitHubWebhookSignature: vi.fn(),
}));

import { verifyGitHubWebhookSignature } from '../api/v2/github/services/verify-webhook-signature';

describe('githubWebhookValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  const mockPayload = {
    action: 'created',
    installation: {
      id: 123456,
      account: {
        id: 789,
        login: 'test-org',
      },
    },
  };

  const createMockContext = (signature?: string, body = mockPayload) => {
    const app = new Hono();
    app.use('*', githubWebhookValidator());
    app.post('/', (c) => {
      const payload = c.get('githubPayload');
      return c.json({ payload });
    });

    const headers: Record<string, string> = {};
    if (signature) {
      headers['X-Hub-Signature-256'] = signature;
    }

    return {
      app,
      headers,
      body: JSON.stringify(body),
    };
  };

  it('should validate a valid webhook request', async () => {
    const { app, headers, body } = createMockContext('sha256=test-signature');

    // Mock environment variable
    process.env.GITHUB_WEBHOOK_SECRET = 'test-secret';

    // Mock signature verification to return true
    vi.mocked(verifyGitHubWebhookSignature).mockReturnValue(true);

    const res = await app.request('/', {
      method: 'POST',
      headers,
      body,
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as { payload: typeof mockPayload };
    expect(data.payload).toEqual(mockPayload);
    expect(verifyGitHubWebhookSignature).toHaveBeenCalledWith(body, 'sha256=test-signature');
  });

  it('should reject request without signature header', async () => {
    const { app, body } = createMockContext(); // No signature

    process.env.GITHUB_WEBHOOK_SECRET = 'test-secret';

    const res = await app.request('/', {
      method: 'POST',
      body,
    });

    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).toBe('Missing X-Hub-Signature-256 header');
  });

  it('should reject request with invalid signature', async () => {
    const { app, headers, body } = createMockContext('sha256=invalid-signature');

    process.env.GITHUB_WEBHOOK_SECRET = 'test-secret';

    // Mock signature verification to return false
    vi.mocked(verifyGitHubWebhookSignature).mockReturnValue(false);

    const res = await app.request('/', {
      method: 'POST',
      headers,
      body,
    });

    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).toBe('Invalid webhook signature');
  });

  it('should reject request when webhook secret is not configured', async () => {
    const { app, headers, body } = createMockContext('sha256=test-signature');

    // Remove environment variable
    delete process.env.GITHUB_WEBHOOK_SECRET;

    const res = await app.request('/', {
      method: 'POST',
      headers,
      body,
    });

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe('GITHUB_WEBHOOK_SECRET not configured');
  });

  it('should reject request with invalid JSON payload', async () => {
    const { app, headers } = createMockContext('sha256=test-signature');

    process.env.GITHUB_WEBHOOK_SECRET = 'test-secret';
    vi.mocked(verifyGitHubWebhookSignature).mockReturnValue(true);

    const res = await app.request('/', {
      method: 'POST',
      headers,
      body: 'invalid json',
    });

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe('Invalid webhook payload');
  });

  it('should reject request with invalid payload schema', async () => {
    const invalidPayload = {
      action: 'created',
      // Missing required installation field - type assertion needed for test
    } as any;

    const { app, headers, body } = createMockContext('sha256=test-signature', invalidPayload);

    process.env.GITHUB_WEBHOOK_SECRET = 'test-secret';
    vi.mocked(verifyGitHubWebhookSignature).mockReturnValue(true);

    const res = await app.request('/', {
      method: 'POST',
      headers,
      body,
    });

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe('Invalid webhook payload');
  });
});
