import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock js-cookie
const mockJsCookie = {
  get: vi.fn(),
};

vi.mock('js-cookie', () => ({
  default: mockJsCookie,
}));

// Import after mocking
import {
  getSupabaseCookieRawClient,
  parseBase64Cookie,
  resetSupabaseCookieNameCache,
} from './cookie-helpers';

// Mock the document.cookie property more effectively
const mockDocumentCookie = vi.fn();
Object.defineProperty(document, 'cookie', {
  get: mockDocumentCookie,
  configurable: true,
});

describe('parseBase64Cookie', () => {
  const realCookieValue =
    'base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSklVekkxTmlJc0ltdHBaQ0k2SW5WeVdVZGhla05YUlc1emNIVjRORmdpTENKMGVYQWlPaUpLVjFRaWZRLmV5SnBjM01pT2lKb2RIUndjem92TDNac1pXeHlkR3g0YjJsNGRtRjVibUYxWkdGMUxuTjFjR0ZpWVhObExtTnZMMkYxZEdodmRqRWlMQ0p6ZFdJaU9pSTJPRFF3Wm1Fd05DMWpNR1EzTFRSbE1HVXRPR1F6WkMxbFlUa3hPVEJrT1RNNE56UWlMQ0poZFdRaU9pSmhkWFJvWlc1MGFXTmhkR1ZrSWl3aVpYaHdJam94TnpVNE1EUXhNRFk0TENKcFlYUWlPakUzTlRnd016YzBOamdzSW1WdFlXbHNJam9pYm1GMFpVQmlkWE4wWlhJdWMyOGlMQ0p3YUc5dVpTSTZJaUlzSW1Gd2NGOXRaWFJoWkdGMFlTSTZleUp3Y205MmFXUmxjaUk2SW1WdFlXbHNJaXdpY0hKdmRtbGtaWEp6SWpwYkltVnRZV2xzSWl3aVoyOXZaMnhsSWwxOUxDSjFjMlZ5WDIxbGRHRmtZWFJoSWpwN0ltRjJZWFJoY2w5MWNtd2lPaUpvZEhSd2N6b3ZMMnhvTXk1bmIyOW5iR1YxYzJWeVkyOXVkR1Z1ZEM1amIyMHZZUzlCUTJjNGIyTkpXSFp0ZDBZNGRubFhRVlpoYm1GU1lWOW9XalpXTlU5NFNVcHVjRVZpYTJ0VVpETmtTRlpWVEhSMlVVZ3paVUU5Y3prMkxXTWlMQ0pqZFhOMGIyMWZZMnhoYVcxeklqcDdJbWhrSWpvaVluVnpkR1Z5TG5OdkluMHNJbVZ0WVdsc0lqb2libUYwWlVCaWRYTjBaWEl1YzI4aUxDSmxiV0ZwYkY5MlpYSnBabWxsWkNJNmRISjFaU3dpWm5Wc2JGOXVZVzFsSWpvaVRtRjBaU0JMWld4c1pYa2lMQ0pwYzNVaU9pSm9kSFJ3Y3pvdkwyRmpZMjkxYm5SekxtZHZiMmRzWlM1amIyMGlMQ0p1WVcxbElqb2lUbUYwWlNCTFpXeHNaWGtpTENKd2FHOXVaVjkyWlhKcFptbGxaQ0k2Wm1Gc2MyVXNJbkJwWTNSMWNtVWlPaUpvZEhSd2N6b3ZMMnhvTXk1bmIyOW5iR1YxYzJWeVkyOXVkR1Z1ZEM1amIyMHZZUzlCUTJjNGIyTkpXSFp0ZDBZNGRubFhRVlpoYm1GU1lWOW9XalpXTlU5NFNVcHVjRVZpYTJ0VVpETmtTRlpWVEhSMlVVZ3paVUU5Y3prMkxXTWlMQ0p3Y205MmFXUmxjbDlwWkNJNklqRXhOakV3TURZeU1qTXdOalk1TVRFNU56Z3hOQ0lzSW5OMVlpSTZJakV4TmpFd01EWXlNak13TmpZNU1URTVOemd4TkNKOUxDSnliMnhsSWpvaVlYVjBhR1Z1ZEdsallYUmxaQ0lzSW1GaGJDSTZJbUZoYkRFaUxDSmhiWElpT2x0N0ltMWxkR2h2WkNJNkltOWhkWFJvSWl3aWRHbHRaWE4wWVcxd0lqb3hOelU0TURNM05EWTRmVjBzSW5ObGMzTnBiMjVmYVdRaU9pSTVNRGhpWkRBeE1TMDRPVEptTFRRMk5XWXRPVGxrTkMweVpXVmlaV1k0TkdZM09HTWlMQ0pwYzE5aGJtOXVlVzF2ZFhNaU9tWmhiSE5sZlEuUXM0elpmNkluYnBVWFY4amZQMlgzOU1wRHZpbU5WLWpuOFRBNEhTcFYxRSIsInRva2VuX3R5cGUiOiJiZWFyZXIiLCJleHBpcmVzX2luIjozNjAwLCJleHBpcmVzX2F0IjoxNzU4MDQxMDY4LCJyZWZyZXNoX3Rva2VuIjoiZWtiZzR0amZyc2U0IiwidXNlciI6eyJpZCI6IjY4NDBmYTA0LWMwZDctNGUwZS04ZDNkLWVhOTE5MGQ5Mzg3NCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImVtYWlsIjoibmF0ZUBidXN0ZXIuc28iLCJlbWFpbF9jb25maXJtZWRfYXQiOiIyMDI0LTA4LTE1VDE4OjQzOjU2LjI4MzM4OVoiLCJwaG9uZSI6IiIsImNvbmZpcm1lZF9hdCI6IjIwMjQtMDgtMTVUMTg6NDM6NTYuMjgzMzg5WiIsImxhc3Rfc2lnbl9pbl9hdCI6IjIwMjUtMDktMTZUMTU6NDQ6MjguNjUxMzUyMjg1WiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIiwiZ29vZ2xlIl19LCJ1c2VyX21ldGFkYXRhIjp7ImF2YXRhcl91cmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJWHZtd0Y4dnlXQVZhbmFSYV9oWjZWNU94SUpucEVia2tUZDNkSFZVTHR2UUgzZUE9czk2LWMiLCJjdXN0b21fY2xhaW1zIjp7ImhkIjoiYnVzdGVyLnNvIn0sImVtYWlsIjoibmF0ZUBidXN0ZXIuc28iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiTmF0ZSBLZWxsZXkiLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiTmF0ZSBLZWxsZXkiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJWHZtd0Y4dnlXQVZhbmFSYV9oWjZWNU94SUpucEVia2tUZDNkSFZVTHR2UUgzZUE9czk2LWMiLCJwcm92aWRlcl9pZCI6IjExNjEwMDYyMjMwNjY5MTE5NzgxNCIsInN1YiI6IjExNjEwMDYyMjMwNjY5MTE5NzgxNCJ9LCJpZGVudGl0aWVzIjpbeyJpZGVudGl0eV9pZCI6IjY4NDBmYTA0LWMwZDctNGUwZS04ZDNkLWVhOTE5MGQ5Mzg3NCIsImlkIjoiNjg0MGZhMDQtYzBkNy00ZTBlLThkM2QtZWE5MTkwZDkzODc0IiwiaWRlbnRpdHlfZGF0YSI6eyJlbWFpbCI6Im5hdGVAYnVzdGVyLnNvIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6Ik5hdGUgS2VsbGV5IiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6Ik5hdGUgS2VsbGV5IiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSVh2bXdGOHZ5V0FWYW5hUmFfaFo2VjVPeElKbnBFYmtrVGQzZEhWVUx0dlFIM2VBPXM5Ni1jIiwicHJvdmlkZXJfaWQiOiIxMTYxMDA2MjIzMDY2OTExOTc4MTQiLCJzdWIiOiIxMTYxMDA2MjIzMDY2OTExOTc4MTQifSwicHJvdmlkZXIiOiJnb29nbGUiLCJsYXN0X3NpZ25faW5fYXQiOiIyMDI0LTA4LTE1VDE4OjQzOjU2LjI4MzM4OVoiLCJjcmVhdGVkX2F0IjoiMjAyNC0wOC0xNVQxODo0Mzo1Ni4yODMzODlaIiwidXBkYXRlZF9hdCI6IjIwMjUtMDktMTZUMTU6NDQ6MjguNjUxNjQyNTYzWiIsImVtYWlsIjoibmF0ZUBidXN0ZXIuc28ifV0sImNyZWF0ZWRfYXQiOiIyMDI0LTA4LTE1VDE4OjQzOjU2LjI4MzM4OVoiLCJ1cGRhdGVkX2F0IjoiMjAyNS0wOS0xNlQxNTo0NDoyOC42NTE2NDI1NjNaIiwiaXNfYW5vbnltb3VzIjpmYWxzZX19';

  it('should parse valid base64 cookie with base64- prefix', () => {
    const result = parseBase64Cookie(realCookieValue);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('access_token');
    expect(result).toHaveProperty('token_type', 'bearer');
    expect(result).toHaveProperty('expires_in', 3600);
    expect(result).toHaveProperty('expires_at', 1758041068);
    expect(result).toHaveProperty('refresh_token', 'ekbg4tjfrse4');
    expect(result).toHaveProperty('user');
    expect(result?.user).toHaveProperty('id', '6840fa04-c0d7-4e0e-8d3d-ea9190d93874');
    expect(result?.user).toHaveProperty('email', 'nate@buster.so');
    expect(result?.user).toHaveProperty('role', 'authenticated');
  });

  it('should parse valid base64 cookie without base64- prefix', () => {
    const cookieWithoutPrefix = realCookieValue.replace('base64-', '');
    const result = parseBase64Cookie(cookieWithoutPrefix);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('user');
    expect(result?.user).toHaveProperty('email', 'nate@buster.so');
  });

  it('should return null for empty string', () => {
    const result = parseBase64Cookie('');
    expect(result).toBeNull();
  });

  it('should return null for null input', () => {
    const result = parseBase64Cookie(null as any);
    expect(result).toBeNull();
  });

  it('should return null for undefined input', () => {
    const result = parseBase64Cookie(undefined as any);
    expect(result).toBeNull();
  });

  it('should return null for invalid base64', () => {
    const result = parseBase64Cookie('base64-invalid-base64-string');
    expect(result).toBeNull();
  });

  it('should return null for malformed JSON', () => {
    // Create a base64 string that decodes to invalid JSON
    const invalidJson = btoa('{"incomplete": json');
    const result = parseBase64Cookie(`base64-${invalidJson}`);
    expect(result).toBeNull();
  });

  it('should handle base64 string that needs padding', () => {
    // Create a simple JSON object and encode it without proper padding
    const testData = { test: 'value' };
    const jsonStr = JSON.stringify(testData);
    const base64 = btoa(jsonStr).replace(/=/g, ''); // Remove padding

    const result = parseBase64Cookie(`base64-${base64}`);
    expect(result).toEqual(testData);
  });

  it('another cookie test', () => {
    const cookie = `base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSklVekkxTmlJc0ltdHBaQ0k2SW5WeVdVZGhla05YUlc1emNIVjRORmdpTENKMGVYQWlPaUpLVjFRaWZRLmV5SnBjM01pT2lKb2RIUndjem92TDNac1pXeHlkR3g0YjJsNGRtRjVibUYxWkdGMUxuTjFjR0ZpWVhObExtTnZMMkYxZEdndmRqRWlMQ0p6ZFdJaU9pSTJPRFF3Wm1Fd05DMWpNR1EzTFRSbE1HVXRPR1F6WkMxbFlUa3hPVEJrT1RNNE56UWlMQ0poZFdRaU9pSmhkWFJvWlc1MGFXTmhkR1ZrSWl3aVpYaHdJam94TnpVNE1EUTFOREU0TENKcFlYUWlPakUzTlRnd05ERTRNVGdzSW1WdFlXbHNJam9pYm1GMFpVQmlkWE4wWlhJdWMyOGlMQ0p3YUc5dVpTSTZJaUlzSW1Gd2NGOXRaWFJoWkdGMFlTSTZleUp3Y205MmFXUmxjaUk2SW1WdFlXbHNJaXdpY0hKdmRtbGtaWEp6SWpwYkltVnRZV2xzSWl3aVoyOXZaMnhsSWwxOUxDSjFjMlZ5WDIxbGRHRmtZWFJoSWpwN0ltRjJZWFJoY2w5MWNtd2lPaUpvZEhSd2N6b3ZMMnhvTXk1bmIyOW5iR1YxYzJWeVkyOXVkR1Z1ZEM1amIyMHZZUzlCUTJjNGIyTkpXSFp0ZDBZNGRubFhRVlpoYm1GU1lWOW9XalpXTlU5NFNVcHVjRVZpYTJ0VVpETmtTRlpWVEhSMlVVZ3paVUU5Y3prMkxXTWlMQ0pqZFhOMGIyMWZZMnhoYVcxeklqcDdJbWhrSWpvaVluVnpkR1Z5TG5OdkluMHNJbVZ0WVdsc0lqb2libUYwWlVCaWRYTjBaWEl1YzI4aUxDSmxiV0ZwYkY5MlpYSnBabWxsWkNJNmRISjFaU3dpWm5Wc2JGOXVZVzFsSWpvaVRtRjBaU0JMWld4c1pYa2lMQ0pwYzNNaU9pSm9kSFJ3Y3pvdkwyRmpZMjkxYm5SekxtZHZiMmRzWlM1amIyMGlMQ0p1WVcxbElqb2lUbUYwWlNCTFpXeHNaWGtpTENKd2FHOXVaVjkyWlhKcFptbGxaQ0k2Wm1Gc2MyVXNJbkJwWTNSMWNtVWlPaUpvZEhSd2N6b3ZMMnhvTXk1bmIyOW5iR1YxYzJWeVkyOXVkR1Z1ZEM1amIyMHZZUzlCUTJjNGIyTkpXSFp0ZDBZNGRubFhRVlpoYm1GU1lWOW9XalpXTlU5NFNVcHVjRVZpYTJ0VVpETmtTRlpWVEhSMlVVZ3paVUU5Y3prMkxXTWlMQ0p3Y205MmFXUmxjbDlwWkNJNklqRXhOakV3TURZeU1qTXdOalk1TVRFNU56Z3hOQ0lzSW5OMVlpSTZJakV4TmpFd01EWXlNak13TmpZNU1URTVOemd4TkNKOUxDSnliMnhsSWpvaVlYVjBhR1Z1ZEdsallYUmxaQ0lzSW1GaGJDSTZJbUZoYkRFaUxDSmhiWElpT2x0N0ltMWxkR2h2WkNJNkltOWhkWFJvSWl3aWRHbHRaWE4wWVcxd0lqb3hOelU0TURReE9ERTRmVjBzSW5ObGMzTnBiMjVmYVdRaU9pSTNOekppWkdFM05pMHpZak0zTFRRelpUUXRPRGt3TWkxbE0yRm1PVGMxTlRVNU0yTWlMQ0pwYzE5aGJtOXVlVzF2ZFhNaU9tWmhiSE5sZlEudng1RFpHamJHazVId2VldW12TFptVlY0UGt2Qjh2S0tvYVR1Sld5NVpubyIsInRva2VuX3R5cGUiOiJiZWFyZXIiLCJleHBpcmVzX2luIjozNjAwLCJleHBpcmVzX2F0IjoxNzU4MDQ1NDE4LCJyZWZyZXNoX3Rva2VuIjoiNDdnYzV1dHhvZXVtIiwidXNlciI6eyJpZCI6IjY4NDBmYTA0LWMwZDctNGUwZS04ZDNkLWVhOTE5MGQ5Mzg3NCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImVtYWlsIjoibmF0ZUBidXN0ZXIuc28iLCJlbWFpbF9jb25maXJtZWRfYXQiOiIyMDI0LTA4LTE1VDE4OjQzOjU2LjI4MzM4OVoiLCJwaG9uZSI6IiIsImNvbmZpcm1lZF9hdCI6IjIwMjQtMDgtMTVUMTg6NDM6NTYuMjgzMzg5WiIsImxhc3Rfc2lnbl9pbl9hdCI6IjIwMjUtMDktMTZUMTY6NTY6NTguMDA4NTA2MzIzWiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIiwiZ29vZ2xlIl19LCJ1c2VyX21ldGFkYXRhIjp7ImF2YXRhcl91cmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJWHZtd0Y4dnlXQVZhbmFSYV9oWjZWNU94SUpucEVia2tUZDNkSFZVTHR2UUgzZUE9czk2LWMiLCJjdXN0b21fY2xhaW1zIjp7ImhkIjoiYnVzdGVyLnNvIn0sImVtYWlsIjoibmF0ZUBidXN0ZXIuc28iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiTmF0ZSBLZWxsZXkiLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiTmF0ZSBLZWxsZXkiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJWHZtd0Y4dnlXQVZhbmFSYV9oWjZWNU94SUpucEVia2tUZDNkSFZVTHR2UUgzZUE9czk2LWMiLCJwcm92aWRlcl9pZCI6IjExNjEwMDYyMjMwNjY5MTE5NzgxNCIsInN1YiI6IjExNjEwMDYyMjMwNjY5MTE5NzgxNCJ9LCJpZGVudGl0aWVzIjpbeyJpZGVudGl0eV9pZCI6IjY4NDBmYTA0LWMwZDctNGUwZS04ZDNkLWVhOTE5MGQ5Mzg3NCIsImlkIjoiNjg0MGZhMDQtYzBkN`;
    const result = parseBase64Cookie(cookie);
    expect(result?.access_token).toBeDefined();
    expect(result?.user).toBeDefined();
    expect(result?.user).toHaveProperty('email', 'nate@buster.so');
  });
});

describe('getSupabaseCookieRawClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDocumentCookie.mockClear();
    mockJsCookie.get.mockClear();
    resetSupabaseCookieNameCache(); // Reset the module-level cache
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should find and return Supabase auth cookie from document.cookie when no cache exists', async () => {
    const cookieValue = 'base64-auth-token-value';
    mockDocumentCookie.mockReturnValue(
      `other-cookie=value; sb-project-auth-token=${cookieValue}; another-cookie=another-value`
    );

    const result = await getSupabaseCookieRawClient();

    expect(result).toBe(cookieValue);
  });

  it('should return undefined when no matching Supabase cookie is found', async () => {
    mockDocumentCookie.mockReturnValue('regular-cookie=value; other-cookie=another-value');

    const result = await getSupabaseCookieRawClient();

    expect(result).toBeUndefined();
  });

  it('should return empty string when an error occurs during cookie parsing', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock listAllCookies to throw an error by making document.cookie.split throw
    mockDocumentCookie.mockImplementation(() => {
      throw new Error('Cookie access denied');
    });

    const result = await getSupabaseCookieRawClient();

    expect(result).toBe('');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to get supabase cookie raw:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should only match cookies that start with sb-, contain -auth-token, and have base64- value', async () => {
    mockDocumentCookie.mockReturnValue(
      'sb-invalid=regular-value; ' +
        'sb-project-auth-token=not-base64-value; ' +
        'sb-correct-auth-token=base64-correct-value; ' +
        'not-sb-auth-token=base64-wrong-prefix'
    );

    const result = await getSupabaseCookieRawClient();

    expect(result).toBe('base64-correct-value');
  });
});
