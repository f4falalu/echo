import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { SlackIntegrationError } from '../types/errors';
import {
  getRawBody,
  handleUrlVerification,
  parseSlackWebhookPayload,
  verifySlackRequest,
} from './webhook-verification';

describe('webhook-verification', () => {
  const signingSecret = 'test-signing-secret';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const rawBody = '{"test":"data"}';

  const generateSignature = (body: string, ts: string, secret: string): string => {
    const baseString = `v0:${ts}:${body}`;
    const hmac = createHmac('sha256', secret);
    hmac.update(baseString, 'utf8');
    return `v0=${hmac.digest('hex')}`;
  };

  describe('verifySlackRequest', () => {
    it('should verify a valid request', () => {
      const signature = generateSignature(rawBody, timestamp, signingSecret);
      const headers = {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': signature,
      };

      const result = verifySlackRequest(rawBody, headers, signingSecret);
      expect(result).toBe(true);
    });

    it('should handle headers with different casing', () => {
      const signature = generateSignature(rawBody, timestamp, signingSecret);
      const headers = {
        'X-Slack-Request-Timestamp': timestamp,
        'X-SLACK-SIGNATURE': signature,
      };

      const result = verifySlackRequest(rawBody, headers, signingSecret);
      expect(result).toBe(true);
    });

    it('should handle array header values', () => {
      const signature = generateSignature(rawBody, timestamp, signingSecret);
      const headers = {
        'x-slack-request-timestamp': [timestamp],
        'x-slack-signature': [signature],
      };

      const result = verifySlackRequest(rawBody, headers, signingSecret);
      expect(result).toBe(true);
    });

    it('should throw error for missing headers', () => {
      const headers = {};

      expect(() => verifySlackRequest(rawBody, headers, signingSecret)).toThrow(
        SlackIntegrationError
      );
      expect(() => verifySlackRequest(rawBody, headers, signingSecret)).toThrow(
        'Missing required Slack headers'
      );
    });

    it('should throw error for old timestamp', () => {
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 400).toString(); // 6+ minutes old
      const signature = generateSignature(rawBody, oldTimestamp, signingSecret);
      const headers = {
        'x-slack-request-timestamp': oldTimestamp,
        'x-slack-signature': signature,
      };

      expect(() => verifySlackRequest(rawBody, headers, signingSecret)).toThrow(
        'Request timestamp is too old'
      );
    });

    it('should throw error for invalid signature', () => {
      const headers = {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': 'v0=invalid_signature',
      };

      expect(() => verifySlackRequest(rawBody, headers, signingSecret)).toThrow(
        'Invalid request signature'
      );
    });

    it('should throw error for wrong signing secret', () => {
      const signature = generateSignature(rawBody, timestamp, 'wrong-secret');
      const headers = {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': signature,
      };

      expect(() => verifySlackRequest(rawBody, headers, signingSecret)).toThrow(
        'Invalid request signature'
      );
    });
  });

  describe('handleUrlVerification', () => {
    it('should return challenge for valid URL verification', () => {
      const body = {
        token: 'test-token',
        challenge: 'test-challenge-string',
        type: 'url_verification',
      };

      const result = handleUrlVerification(body);
      expect(result).toBe('test-challenge-string');
    });

    it('should return null for non-URL verification requests', () => {
      const body = {
        type: 'event_callback',
        event: { type: 'message' },
      };

      const result = handleUrlVerification(body);
      expect(result).toBeNull();
    });

    it('should return null for invalid body', () => {
      const result = handleUrlVerification('invalid');
      expect(result).toBeNull();
    });
  });

  describe('parseSlackWebhookPayload', () => {
    it('should parse URL verification payload', () => {
      const payload = {
        token: 'test-token',
        challenge: 'test-challenge',
        type: 'url_verification',
      };

      const result = parseSlackWebhookPayload(payload);
      expect(result).toEqual(payload);
    });

    it('should parse event callback payload', () => {
      const payload = {
        token: 'test-token',
        team_id: 'T123456',
        api_app_id: 'A123456',
        event: {
          type: 'app_mention',
          user: 'U123456',
          text: '<@U0LAN0Z89> hello',
          ts: '1515449522.000016',
          channel: 'C123456',
          event_ts: '1515449522000016',
        },
        type: 'event_callback',
        event_id: 'Ev123456',
        event_time: 1234567890,
      };

      const result = parseSlackWebhookPayload(payload);
      expect(result).toEqual(payload);
    });

    it('should throw error for invalid payload', () => {
      const invalidPayload = {
        type: 'invalid_type',
      };

      expect(() => parseSlackWebhookPayload(invalidPayload)).toThrow(SlackIntegrationError);
      expect(() => parseSlackWebhookPayload(invalidPayload)).toThrow('Invalid webhook payload');
    });

    it('should throw error for non-object payload', () => {
      expect(() => parseSlackWebhookPayload('string')).toThrow('Invalid webhook payload');
      expect(() => parseSlackWebhookPayload(123)).toThrow('Invalid webhook payload');
      expect(() => parseSlackWebhookPayload(null)).toThrow('Invalid webhook payload');
    });
  });

  describe('getRawBody', () => {
    it('should return string as-is', () => {
      const body = 'test string';
      expect(getRawBody(body)).toBe(body);
    });

    it('should convert Buffer to string', () => {
      const body = Buffer.from('test buffer', 'utf8');
      expect(getRawBody(body)).toBe('test buffer');
    });

    it('should stringify objects', () => {
      const body = { test: 'data' };
      expect(getRawBody(body)).toBe('{"test":"data"}');
    });

    it('should handle null', () => {
      expect(getRawBody(null)).toBe('');
    });

    it('should handle undefined', () => {
      expect(getRawBody(undefined)).toBe('');
    });

    it('should handle numbers', () => {
      expect(getRawBody(123)).toBe('');
    });
  });
});
