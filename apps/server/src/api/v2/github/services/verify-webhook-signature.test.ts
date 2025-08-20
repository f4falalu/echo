import { createHmac } from 'node:crypto';
import { GitHubErrorCode } from '@buster/server-shared/github';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  extractGitHubWebhookSignature,
  verifyGitHubWebhook,
  verifyGitHubWebhookSignature,
} from './verify-webhook-signature';

describe('verify-webhook-signature', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Set up test environment
    process.env = {
      ...originalEnv,
      GITHUB_APP_ID: '123456',
      GITHUB_APP_PRIVATE_KEY_BASE64: Buffer.from(
        '-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----'
      ).toString('base64'),
      GITHUB_WEBHOOK_SECRET: 'test-webhook-secret',
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('verifyGitHubWebhookSignature', () => {
    it('should return true for valid signature', () => {
      // Arrange
      const payload = JSON.stringify({ test: 'data' });
      const signature = `sha256=${createHmac('sha256', 'test-webhook-secret').update(payload).digest('hex')}`;

      // Act
      const result = verifyGitHubWebhookSignature(payload, signature);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      // Arrange
      const payload = JSON.stringify({ test: 'data' });
      const signature = 'sha256=invalid-signature';

      // Act
      const result = verifyGitHubWebhookSignature(payload, signature);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when signature is missing', () => {
      // Arrange
      const payload = JSON.stringify({ test: 'data' });

      // Act
      const result = verifyGitHubWebhookSignature(payload, undefined);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when signature format is invalid', () => {
      // Arrange
      const payload = JSON.stringify({ test: 'data' });
      const signature = 'invalid-format-signature';

      // Act
      const result = verifyGitHubWebhookSignature(payload, signature);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when signature has wrong algorithm', () => {
      // Arrange
      const payload = JSON.stringify({ test: 'data' });
      const signature = `sha1=${createHmac('sha1', 'test-webhook-secret').update(payload).digest('hex')}`;

      // Act
      const result = verifyGitHubWebhookSignature(payload, signature);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle different payload types', () => {
      // Arrange
      const payload = 'plain-text-payload';
      const signature = `sha256=${createHmac('sha256', 'test-webhook-secret').update(payload).digest('hex')}`;

      // Act
      const result = verifyGitHubWebhookSignature(payload, signature);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('extractGitHubWebhookSignature', () => {
    it('should extract signature from headers', () => {
      // Arrange
      const headers = {
        'x-hub-signature-256': 'sha256=test-signature',
        'content-type': 'application/json',
      };

      // Act
      const signature = extractGitHubWebhookSignature(headers);

      // Assert
      expect(signature).toBe('sha256=test-signature');
    });

    it('should handle array header values', () => {
      // Arrange
      const headers = {
        'x-hub-signature-256': ['sha256=first-signature', 'sha256=second-signature'],
      };

      // Act
      const signature = extractGitHubWebhookSignature(headers);

      // Assert
      expect(signature).toBe('sha256=first-signature');
    });

    it('should return undefined when signature header is missing', () => {
      // Arrange
      const headers = {
        'content-type': 'application/json',
      };

      // Act
      const signature = extractGitHubWebhookSignature(headers);

      // Assert
      expect(signature).toBeUndefined();
    });

    it('should handle undefined header value', () => {
      // Arrange
      const headers = {
        'x-hub-signature-256': undefined,
      };

      // Act
      const signature = extractGitHubWebhookSignature(headers);

      // Assert
      expect(signature).toBeUndefined();
    });
  });

  describe('verifyGitHubWebhook', () => {
    it('should not throw for valid webhook', () => {
      // Arrange
      const payload = JSON.stringify({ test: 'data' });
      const signature = `sha256=${createHmac('sha256', 'test-webhook-secret').update(payload).digest('hex')}`;
      const headers = {
        'x-hub-signature-256': signature,
      };

      // Act & Assert
      expect(() => verifyGitHubWebhook(payload, headers)).not.toThrow();
    });

    it('should throw when signature is missing', () => {
      // Arrange
      const payload = JSON.stringify({ test: 'data' });
      const headers = {};

      // Act & Assert
      expect(() => verifyGitHubWebhook(payload, headers)).toThrow(
        'Missing X-Hub-Signature-256 header'
      );
    });

    it('should throw when signature is invalid', () => {
      // Arrange
      const payload = JSON.stringify({ test: 'data' });
      const headers = {
        'x-hub-signature-256': 'sha256=invalid-signature',
      };

      // Act & Assert
      expect(() => verifyGitHubWebhook(payload, headers)).toThrow('Invalid webhook signature');
    });

    it('should include error code in thrown error', () => {
      // Arrange
      const payload = JSON.stringify({ test: 'data' });
      const headers = {
        'x-hub-signature-256': 'sha256=invalid-signature',
      };

      // Act
      let error: any;
      try {
        verifyGitHubWebhook(payload, headers);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeDefined();
      expect(error.code).toBe(GitHubErrorCode.WEBHOOK_VERIFICATION_FAILED);
    });
  });
});
