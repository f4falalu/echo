import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { SlackIntegrationError } from '../types/errors';
import type { SlackEventEnvelope, UrlVerification } from '../types/webhooks';
import {
  handleUrlVerification,
  parseSlackWebhookPayload,
  verifySlackRequest,
} from './webhook-verification';

describe('webhook-verification integration tests', () => {
  // Mock signing secret (in real scenario, this would be from environment)
  const MOCK_SIGNING_SECRET = 'b6a8e2d4f9c3e1a7d5b2f8e4c9a3d6f1';

  describe('Full webhook verification flow', () => {
    it('should handle URL verification challenge end-to-end', () => {
      // 1. Slack sends URL verification
      const urlVerificationPayload: UrlVerification = {
        token: 'Jhj5dZrVaK7ZwHHjRyZWjbDl',
        challenge: '3eZbrw1aBm2rZgRNFdxV2595E9CY3gmdALWMmHkvFXO7tYXAYM8P',
        type: 'url_verification',
      };

      const rawBody = JSON.stringify(urlVerificationPayload);
      const timestamp = Math.floor(Date.now() / 1000).toString();

      // 2. Generate signature like Slack would
      const baseString = `v0:${timestamp}:${rawBody}`;
      const hmac = createHmac('sha256', MOCK_SIGNING_SECRET);
      hmac.update(baseString, 'utf8');
      const signature = `v0=${hmac.digest('hex')}`;

      const headers = {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': signature,
      };

      // 3. Verify the request
      const isValid = verifySlackRequest(rawBody, headers, MOCK_SIGNING_SECRET);
      expect(isValid).toBe(true);

      // 4. Parse the payload
      const parsedPayload = parseSlackWebhookPayload(JSON.parse(rawBody));
      expect(parsedPayload).toEqual(urlVerificationPayload);

      // 5. Handle URL verification
      const challenge = handleUrlVerification(parsedPayload);
      expect(challenge).toBe(urlVerificationPayload.challenge);
    });

    it('should handle event callback with verification', () => {
      // 1. Slack sends an event
      const eventPayload: SlackEventEnvelope = {
        token: 'XXYYZZ',
        team_id: 'TXXXXXXXX',
        api_app_id: 'AXXXXXXXXX',
        event: {
          type: 'app_mention',
          user: 'U123456',
          text: '<@U0LAN0Z89> is it a bird?',
          ts: '1515449522.000016',
          channel: 'C123456',
          event_ts: '1515449522000016',
        },
        type: 'event_callback',
        event_id: 'Ev08MFMKH6',
        event_time: 1234567890,
      };

      const rawBody = JSON.stringify(eventPayload);
      const timestamp = Math.floor(Date.now() / 1000).toString();

      // 2. Generate signature
      const baseString = `v0:${timestamp}:${rawBody}`;
      const hmac = createHmac('sha256', MOCK_SIGNING_SECRET);
      hmac.update(baseString, 'utf8');
      const signature = `v0=${hmac.digest('hex')}`;

      const headers = {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': signature,
      };

      // 3. Verify the request
      const isValid = verifySlackRequest(rawBody, headers, MOCK_SIGNING_SECRET);
      expect(isValid).toBe(true);

      // 4. Parse the payload
      const parsedPayload = parseSlackWebhookPayload(JSON.parse(rawBody));
      expect(parsedPayload).toEqual(eventPayload);

      // 5. Verify it's not a URL verification
      const challenge = handleUrlVerification(parsedPayload);
      expect(challenge).toBeNull();
    });

    it('should reject tampered requests', () => {
      const payload = {
        token: 'test-token',
        type: 'event_callback',
        event: { type: 'message', text: 'hello' },
      };

      const rawBody = JSON.stringify(payload);
      const timestamp = Math.floor(Date.now() / 1000).toString();

      // Generate signature with correct secret
      const baseString = `v0:${timestamp}:${rawBody}`;
      const hmac = createHmac('sha256', MOCK_SIGNING_SECRET);
      hmac.update(baseString, 'utf8');
      const signature = `v0=${hmac.digest('hex')}`;

      // Tamper with the body after signature generation
      const tamperedBody = JSON.stringify({ ...payload, text: 'tampered' });

      const headers = {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': signature,
      };

      // Should fail verification due to body tampering
      expect(() => verifySlackRequest(tamperedBody, headers, MOCK_SIGNING_SECRET)).toThrow(
        SlackIntegrationError
      );
      expect(() => verifySlackRequest(tamperedBody, headers, MOCK_SIGNING_SECRET)).toThrow(
        'Invalid request signature'
      );
    });

    it('should handle replay attack prevention', () => {
      const payload = { type: 'event_callback', event: {} };
      const rawBody = JSON.stringify(payload);

      // Create timestamp 6 minutes ago
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 360).toString();

      const baseString = `v0:${oldTimestamp}:${rawBody}`;
      const hmac = createHmac('sha256', MOCK_SIGNING_SECRET);
      hmac.update(baseString, 'utf8');
      const signature = `v0=${hmac.digest('hex')}`;

      const headers = {
        'x-slack-request-timestamp': oldTimestamp,
        'x-slack-signature': signature,
      };

      // Should reject due to old timestamp
      expect(() => verifySlackRequest(rawBody, headers, MOCK_SIGNING_SECRET)).toThrow(
        'Request timestamp is too old'
      );
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle malformed JSON gracefully', () => {
      const malformedBody = '{"type": "event_callback", "event": {';
      const timestamp = Math.floor(Date.now() / 1000).toString();

      // Even with valid signature, parsing should fail
      const baseString = `v0:${timestamp}:${malformedBody}`;
      const hmac = createHmac('sha256', MOCK_SIGNING_SECRET);
      hmac.update(baseString, 'utf8');
      const signature = `v0=${hmac.digest('hex')}`;

      const headers = {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': signature,
      };

      // Verification passes (signature is valid for the malformed body)
      const isValid = verifySlackRequest(malformedBody, headers, MOCK_SIGNING_SECRET);
      expect(isValid).toBe(true);

      // But parsing should fail
      expect(() => parseSlackWebhookPayload(malformedBody)).toThrow('Invalid webhook payload');
    });

    it('should handle different content types', () => {
      // Form-encoded body (though Slack sends JSON for events)
      const formBody = 'token=test&challenge=abc123&type=url_verification';
      const timestamp = Math.floor(Date.now() / 1000).toString();

      const baseString = `v0:${timestamp}:${formBody}`;
      const hmac = createHmac('sha256', MOCK_SIGNING_SECRET);
      hmac.update(baseString, 'utf8');
      const signature = `v0=${hmac.digest('hex')}`;

      const headers = {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': signature,
      };

      // Should verify successfully (signature is valid)
      const isValid = verifySlackRequest(formBody, headers, MOCK_SIGNING_SECRET);
      expect(isValid).toBe(true);
    });
  });
});
