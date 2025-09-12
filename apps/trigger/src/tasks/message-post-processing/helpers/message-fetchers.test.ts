import * as database from '@buster/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataFetchError } from '../types';
import { fetchPreviousPostProcessingMessages } from './message-fetchers';

// Mock the database module
vi.mock('@buster/database', () => ({
  getDb: vi.fn(),
  and: vi.fn((...args) => ({ type: 'and', args })),
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
  lte: vi.fn((a, b) => ({ type: 'lte', a, b })),
  isNull: vi.fn((a) => ({ type: 'isNull', a })),
  isNotNull: vi.fn((a) => ({ type: 'isNotNull', a })),
  messages: {
    chatId: 'messages.chatId',
    createdAt: 'messages.createdAt',
    postProcessingMessage: 'messages.postProcessingMessage',
    deletedAt: 'messages.deletedAt',
  },
}));

describe('message-fetchers', () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn(),
    };

    // Set up the mock chain to return itself for most methods
    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.where.mockReturnValue(mockDb);

    vi.mocked(database.getDb).mockReturnValue(mockDb);
  });

  describe('fetchPreviousPostProcessingMessages', () => {
    const beforeTimestamp = new Date('2024-01-01T12:00:00Z');

    it('should return only messages with postProcessingMessage', async () => {
      const messages = [
        {
          postProcessingMessage: { assumptions: ['test'] },
          createdAt: '2024-01-01T10:00:00Z',
        },
        {
          postProcessingMessage: { followUp: { suggestions: ['ask more'] } },
          createdAt: '2024-01-01T11:00:00Z',
        },
      ];

      mockDb.orderBy.mockReturnValue(mockDb);
      mockDb.orderBy.mockResolvedValueOnce(messages);

      const result = await fetchPreviousPostProcessingMessages('chat-id', beforeTimestamp);

      expect(result).toHaveLength(2);
      expect(result[0]?.postProcessingMessage).toHaveProperty('assumptions');
      expect(result[1]?.postProcessingMessage).toHaveProperty('followUp');
    });

    it('should order by createdAt ascending', async () => {
      const messages = [
        {
          postProcessingMessage: { id: 1 },
          createdAt: '2024-01-01T10:00:00Z',
        },
        {
          postProcessingMessage: { id: 2 },
          createdAt: '2024-01-01T11:00:00Z',
        },
      ];

      mockDb.orderBy.mockReturnValue(mockDb);
      mockDb.orderBy.mockResolvedValueOnce(messages);

      const result = await fetchPreviousPostProcessingMessages('chat-id', beforeTimestamp);

      expect(result[0]!.createdAt < result[1]!.createdAt).toBe(true);
    });

    it('should return empty array when no results', async () => {
      mockDb.orderBy.mockReturnValue(mockDb);
      mockDb.orderBy.mockResolvedValueOnce([]);

      const result = await fetchPreviousPostProcessingMessages('chat-id', beforeTimestamp);
      expect(result).toEqual([]);
    });

    it('should wrap database errors in DataFetchError', async () => {
      mockDb.orderBy.mockRejectedValue(new Error('Database connection failed'));

      await expect(fetchPreviousPostProcessingMessages('chat-id', beforeTimestamp)).rejects.toThrow(
        DataFetchError
      );
    });
  });
});
