import type { WebClient } from '@slack/web-api';
import { describe, expect, it, vi } from 'vitest';
import { SlackIntegrationError } from '../types/errors';
import { SlackUserService } from './users';

describe('SlackUserService', () => {
  describe('getUserInfo', () => {
    it('should fetch user information successfully', async () => {
      const mockUser = {
        id: 'U123456',
        name: 'john.doe',
        real_name: 'John Doe',
        profile: {
          email: 'john.doe@example.com',
          display_name: 'John',
          real_name: 'John Doe',
          real_name_normalized: 'John Doe',
          team: 'T123456',
        },
        is_bot: false,
        is_app_user: false,
        deleted: false,
        team_id: 'T123456',
      };

      const mockClient = {
        users: {
          info: vi.fn().mockResolvedValue({
            ok: true,
            user: mockUser,
          }),
        },
      } as unknown as WebClient;

      const service = new SlackUserService(mockClient);
      const result = await service.getUserInfo('test-token', 'U123456');

      expect(result).toEqual(mockUser);
      expect(mockClient.users.info).toHaveBeenCalledWith({
        token: 'test-token',
        user: 'U123456',
      });
    });

    it('should throw error when user not found', async () => {
      const mockClient = {
        users: {
          info: vi.fn().mockResolvedValue({
            ok: false,
            error: 'user_not_found',
          }),
        },
      } as unknown as WebClient;

      const service = new SlackUserService(mockClient);

      await expect(service.getUserInfo('test-token', 'U123456')).rejects.toThrow(
        SlackIntegrationError
      );

      await expect(service.getUserInfo('test-token', 'U123456')).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
        message: expect.stringContaining('user_not_found'),
      });
    });

    it('should throw network error on API failure', async () => {
      const mockClient = {
        users: {
          info: vi.fn().mockRejectedValue(new Error('Network error')),
        },
      } as unknown as WebClient;

      const service = new SlackUserService(mockClient);

      await expect(service.getUserInfo('test-token', 'U123456')).rejects.toThrow(
        SlackIntegrationError
      );

      await expect(service.getUserInfo('test-token', 'U123456')).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        message: expect.stringContaining('Failed to fetch user information'),
      });
    });
  });

  describe('getUserEmail', () => {
    it('should return user email when available', async () => {
      const mockClient = {
        users: {
          info: vi.fn().mockResolvedValue({
            ok: true,
            user: {
              id: 'U123456',
              name: 'john.doe',
              profile: {
                email: 'john.doe@example.com',
              },
            },
          }),
        },
      } as unknown as WebClient;

      const service = new SlackUserService(mockClient);
      const email = await service.getUserEmail('test-token', 'U123456');

      expect(email).toBe('john.doe@example.com');
    });

    it('should throw error when email not found', async () => {
      const mockClient = {
        users: {
          info: vi.fn().mockResolvedValue({
            ok: true,
            user: {
              id: 'U123456',
              name: 'john.doe',
              profile: {
                // No email field
              },
            },
          }),
        },
      } as unknown as WebClient;

      const service = new SlackUserService(mockClient);

      await expect(service.getUserEmail('test-token', 'U123456')).rejects.toThrow(
        SlackIntegrationError
      );

      await expect(service.getUserEmail('test-token', 'U123456')).rejects.toMatchObject({
        code: 'EMAIL_NOT_FOUND',
        message: expect.stringContaining('does not have an email address'),
      });
    });

    it('should throw error when profile is missing', async () => {
      const mockClient = {
        users: {
          info: vi.fn().mockResolvedValue({
            ok: true,
            user: {
              id: 'U123456',
              name: 'john.doe',
              // No profile field
            },
          }),
        },
      } as unknown as WebClient;

      const service = new SlackUserService(mockClient);

      await expect(service.getUserEmail('test-token', 'U123456')).rejects.toThrow(
        SlackIntegrationError
      );

      await expect(service.getUserEmail('test-token', 'U123456')).rejects.toMatchObject({
        code: 'EMAIL_NOT_FOUND',
      });
    });
  });

  describe('isBot', () => {
    it('should return true for bot users', async () => {
      const mockClient = {
        users: {
          info: vi.fn().mockResolvedValue({
            ok: true,
            user: {
              id: 'U123456',
              name: 'bot',
              is_bot: true,
              is_app_user: false,
            },
          }),
        },
      } as unknown as WebClient;

      const service = new SlackUserService(mockClient);
      const isBot = await service.isBot('test-token', 'U123456');

      expect(isBot).toBe(true);
    });

    it('should return true for app users', async () => {
      const mockClient = {
        users: {
          info: vi.fn().mockResolvedValue({
            ok: true,
            user: {
              id: 'U123456',
              name: 'app',
              is_bot: false,
              is_app_user: true,
            },
          }),
        },
      } as unknown as WebClient;

      const service = new SlackUserService(mockClient);
      const isBot = await service.isBot('test-token', 'U123456');

      expect(isBot).toBe(true);
    });

    it('should return false for regular users', async () => {
      const mockClient = {
        users: {
          info: vi.fn().mockResolvedValue({
            ok: true,
            user: {
              id: 'U123456',
              name: 'john.doe',
              is_bot: false,
              is_app_user: false,
            },
          }),
        },
      } as unknown as WebClient;

      const service = new SlackUserService(mockClient);
      const isBot = await service.isBot('test-token', 'U123456');

      expect(isBot).toBe(false);
    });
  });

  describe('isDeleted', () => {
    it('should return true for deleted users', async () => {
      const mockClient = {
        users: {
          info: vi.fn().mockResolvedValue({
            ok: true,
            user: {
              id: 'U123456',
              name: 'john.doe',
              deleted: true,
            },
          }),
        },
      } as unknown as WebClient;

      const service = new SlackUserService(mockClient);
      const isDeleted = await service.isDeleted('test-token', 'U123456');

      expect(isDeleted).toBe(true);
    });

    it('should return false for active users', async () => {
      const mockClient = {
        users: {
          info: vi.fn().mockResolvedValue({
            ok: true,
            user: {
              id: 'U123456',
              name: 'john.doe',
              deleted: false,
            },
          }),
        },
      } as unknown as WebClient;

      const service = new SlackUserService(mockClient);
      const isDeleted = await service.isDeleted('test-token', 'U123456');

      expect(isDeleted).toBe(false);
    });

    it('should return false when deleted field is missing', async () => {
      const mockClient = {
        users: {
          info: vi.fn().mockResolvedValue({
            ok: true,
            user: {
              id: 'U123456',
              name: 'john.doe',
              // No deleted field
            },
          }),
        },
      } as unknown as WebClient;

      const service = new SlackUserService(mockClient);
      const isDeleted = await service.isDeleted('test-token', 'U123456');

      expect(isDeleted).toBe(false);
    });
  });
});
