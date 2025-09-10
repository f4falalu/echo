import { generateSuggestedMessages } from '@buster/ai';
import {
  type User,
  type UserSuggestedPromptsField,
  getPermissionedDatasets,
  getUserRecentMessages,
  getUserSuggestedPrompts,
  updateUserSuggestedPrompts,
} from '@buster/database';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import app from './GET';

// Mock all external dependencies
vi.mock('@buster/ai');
vi.mock('@buster/database');

describe('GET /api/v2/users/:id/suggested-prompts', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
    organizationId: 'org-123',
  } as User;

  const mockDefaultPrompts: UserSuggestedPromptsField = {
    suggestedPrompts: {
      report: ['provide a trend analysis of quarterly profits'],
      dashboard: ['create a sales performance dashboard'],
      visualization: ['create a metric for monthly sales'],
      help: ['what types of analyses can you perform?'],
    },
    updatedAt: new Date().toISOString(),
  };

  const mockTodayPrompts: UserSuggestedPromptsField = {
    suggestedPrompts: {
      report: ['Generate Q4 sales report'],
      dashboard: ['Create revenue dashboard'],
      visualization: ['Show top products chart'],
      help: ['How to use analytics?'],
    },
    updatedAt: new Date().toISOString(), // Today's date
  };

  const mockOldPrompts: UserSuggestedPromptsField = {
    suggestedPrompts: {
      report: ['Old report prompt'],
      dashboard: ['Old dashboard prompt'],
      visualization: ['Old viz prompt'],
      help: ['Old help prompt'],
    },
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
  };

  const mockGeneratedPrompts = {
    report: ['New AI generated report'],
    dashboard: ['New AI generated dashboard'],
    visualization: ['New AI generated chart'],
    help: ['New AI generated help'],
  };

  const mockUpdatedPrompts: UserSuggestedPromptsField = {
    suggestedPrompts: mockGeneratedPrompts,
    updatedAt: new Date().toISOString(),
  };

  const mockDatasets = [
    {
      id: 'dataset-1',
      ymlContent: 'table: users\ncolumns:\n  - id\n  - name',
    },
    {
      id: 'dataset-2',
      ymlContent: 'table: orders\ncolumns:\n  - id\n  - total',
    },
  ];

  const mockChatHistory = [
    {
      requestMessage: 'Show me sales data',
      responseMessages: 'Here is your sales data...',
    },
    {
      requestMessage: 'Create a dashboard',
      responseMessages: 'I created a dashboard for you...',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default successful mocks
    (getPermissionedDatasets as Mock).mockResolvedValue({
      datasets: mockDatasets,
    });
    (getUserRecentMessages as Mock).mockResolvedValue(mockChatHistory);
    (generateSuggestedMessages as Mock).mockResolvedValue(mockGeneratedPrompts);
    (updateUserSuggestedPrompts as Mock).mockResolvedValue(mockUpdatedPrompts);
  });

  describe('Authorization', () => {
    it('should return 403 when user tries to access another users prompts', async () => {
      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      const response = await testApp.request('/different-user-id', {
        method: 'GET',
      });

      expect(response.status).toBe(403);
      const body = (await response.json()) as { message: string };
      expect(body.message).toBe('Forbidden: You can only access your own suggested prompts');
    });

    it('should allow user to access their own prompts', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockTodayPrompts);

      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      const response = await testApp.request('/user-123', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      expect(getUserSuggestedPrompts).toHaveBeenCalledWith({ userId: 'user-123' });
    });
  });

  describe('Cached prompts (today)', () => {
    it('should return cached prompts when they were updated today', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockTodayPrompts);

      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      const response = await testApp.request('/user-123', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockTodayPrompts);

      // Should not call AI generation functions
      expect(generateSuggestedMessages).not.toHaveBeenCalled();
      expect(updateUserSuggestedPrompts).not.toHaveBeenCalled();
    });

    it('should return cached prompts even if updated time is just a few minutes ago today', async () => {
      const recentPrompts = {
        ...mockTodayPrompts,
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      };
      (getUserSuggestedPrompts as Mock).mockResolvedValue(recentPrompts);

      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      const response = await testApp.request('/user-123', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(recentPrompts);
      expect(generateSuggestedMessages).not.toHaveBeenCalled();
    });
  });

  describe('Fresh prompts generation (old cache)', () => {
    it('should generate new prompts when cached prompts are from yesterday', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockOldPrompts);

      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      const response = await testApp.request('/user-123', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockUpdatedPrompts);

      // Should call AI generation functions
      expect(getPermissionedDatasets).toHaveBeenCalledWith({
        userId: 'user-123',
        pageSize: 1000,
        page: 0,
      });
      expect(getUserRecentMessages).toHaveBeenCalledWith('user-123', 15);
      expect(generateSuggestedMessages).toHaveBeenCalledWith({
        chatHistoryText: expect.stringContaining('userMessage: Show me sales data'),
        databaseContext: expect.stringContaining('table: users'),
        userId: 'user-123',
      });
      expect(updateUserSuggestedPrompts).toHaveBeenCalledWith({
        userId: 'user-123',
        suggestedPrompts: mockGeneratedPrompts,
      });
    });
  });

  describe('Database context scenarios', () => {
    it('should handle empty datasets gracefully', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockOldPrompts);
      (getPermissionedDatasets as Mock).mockResolvedValue({ datasets: [] });

      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      const response = await testApp.request('/user-123', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockOldPrompts); // Should return old prompts as fallback
    });

    it('should handle datasets without YAML content', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockOldPrompts);
      (getPermissionedDatasets as Mock).mockResolvedValue({
        datasets: [
          { id: 'dataset-1', ymlContent: null },
          { id: 'dataset-2', ymlContent: '' },
          { id: 'dataset-3', ymlContent: '   ' }, // whitespace only
        ],
      });

      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      const response = await testApp.request('/user-123', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockOldPrompts); // Should return old prompts as fallback
    });

    it('should format YAML content correctly with separators', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockOldPrompts);

      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      await testApp.request('/user-123', {
        method: 'GET',
      });

      expect(generateSuggestedMessages).toHaveBeenCalledWith({
        chatHistoryText: expect.any(String),
        databaseContext:
          'table: users\ncolumns:\n  - id\n  - name\n\n---\n\ntable: orders\ncolumns:\n  - id\n  - total',
        userId: 'user-123',
      });
    });
  });

  describe('Chat history scenarios', () => {
    it('should handle empty chat history gracefully', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockOldPrompts);
      (getUserRecentMessages as Mock).mockResolvedValue([]);

      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      const response = await testApp.request('/user-123', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockOldPrompts); // Should return old prompts as fallback
    });

    it('should format chat history correctly', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockOldPrompts);

      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      await testApp.request('/user-123', {
        method: 'GET',
      });

      expect(generateSuggestedMessages).toHaveBeenCalledWith({
        chatHistoryText:
          'userMessage: Show me sales data, assistantResponses: Here is your sales data...\n\nuserMessage: Create a dashboard, assistantResponses: I created a dashboard for you...',
        databaseContext: expect.any(String),
        userId: 'user-123',
      });
    });
  });

  describe('Error handling and fallbacks', () => {
    it('should return 500 when getUserSuggestedPrompts fails', async () => {
      (getUserSuggestedPrompts as Mock).mockRejectedValue(new Error('Database connection failed'));

      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      const response = await testApp.request('/user-123', {
        method: 'GET',
      });

      expect(response.status).toBe(500);
      const body = (await response.json()) as { message: string };
      expect(body.message).toBe('Error fetching suggested prompts');
    });

    it('should fallback to old prompts when AI generation fails', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockOldPrompts);
      (generateSuggestedMessages as Mock).mockRejectedValue(new Error('AI service unavailable'));

      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      const response = await testApp.request('/user-123', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockOldPrompts); // Should return old prompts as fallback
    });

    it('should fallback to default prompts when both AI generation and old prompts fail', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(null);
      (generateSuggestedMessages as Mock).mockRejectedValue(new Error('AI service unavailable'));

      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      const response = await testApp.request('/user-123', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockDefaultPrompts);
    });

    it('should fallback to old prompts when updateUserSuggestedPrompts fails', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockOldPrompts);
      (updateUserSuggestedPrompts as Mock).mockRejectedValue(new Error('Update failed'));

      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      const response = await testApp.request('/user-123', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockOldPrompts); // Should return old prompts as fallback
    });

    it('should handle getPermissionedDatasets failure gracefully', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockOldPrompts);
      (getPermissionedDatasets as Mock).mockRejectedValue(new Error('Permission check failed'));

      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      const response = await testApp.request('/user-123', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockOldPrompts); // Should return old prompts as fallback
    });

    it('should handle getUserRecentMessages failure gracefully', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockOldPrompts);
      (getUserRecentMessages as Mock).mockRejectedValue(new Error('Chat history fetch failed'));

      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      const response = await testApp.request('/user-123', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockOldPrompts); // Should return old prompts as fallback
    });
  });

  describe('Input validation', () => {
    it('should return 400 for invalid UUID format', async () => {
      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      const response = await testApp.request('/invalid-uuid', {
        method: 'GET',
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for empty user ID', async () => {
      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      const response = await testApp.request('/', {
        method: 'GET',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Date comparison edge cases', () => {
    it('should consider prompts updated at 23:59 yesterday as old', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      const yesterdayPrompts = {
        ...mockOldPrompts,
        updatedAt: yesterday.toISOString(),
      };
      (getUserSuggestedPrompts as Mock).mockResolvedValue(yesterdayPrompts);

      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      const response = await testApp.request('/user-123', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      // Should trigger new generation, not return yesterdayPrompts
      expect(generateSuggestedMessages).toHaveBeenCalled();
    });

    it('should consider prompts updated at 00:01 today as fresh', async () => {
      const today = new Date();
      today.setHours(0, 1, 0, 0);

      const earlyTodayPrompts = {
        ...mockTodayPrompts,
        updatedAt: today.toISOString(),
      };
      (getUserSuggestedPrompts as Mock).mockResolvedValue(earlyTodayPrompts);

      const testApp = new Hono();
      testApp.use('*', async (c, next) => {
        c.set('busterUser', mockUser);
        await next();
      });
      testApp.route('/', app);

      const response = await testApp.request('/user-123', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(earlyTodayPrompts);
      // Should not trigger new generation
      expect(generateSuggestedMessages).not.toHaveBeenCalled();
    });
  });
});
