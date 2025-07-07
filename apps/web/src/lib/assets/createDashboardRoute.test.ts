import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDashboardRoute } from './createDashboardRoute';
import { BusterRoutes } from '@/routes/busterRoutes';

// Mock the createBusterRoute function
vi.mock('@/routes/busterRoutes', async () => {
  const actual = await vi.importActual('@/routes/busterRoutes');
  return {
    ...actual
  };
});

describe('createDashboardRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard page tests', () => {
    it('should create chat dashboard route with all parameters', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        chatId: 'chat-456',
        secondaryView: 'version-history',
        dashboardVersionNumber: 5,
        page: 'dashboard'
      });

      expect(result).toBe(
        '/app/chats/chat-456/dashboards/dashboard-123?secondary_view=version-history&dashboard_version_number=5'
      );
    });

    it('should create chat dashboard route with version number only', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        chatId: 'chat-456',
        dashboardVersionNumber: 3,
        page: 'dashboard'
      });

      expect(result).toBe(
        '/app/chats/chat-456/dashboards/dashboard-123?dashboard_version_number=3'
      );
    });

    it('should create chat dashboard route with version-history secondary view', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        chatId: 'chat-456',
        secondaryView: 'version-history',
        page: 'dashboard'
      });

      expect(result).toBe(
        '/app/chats/chat-456/dashboards/dashboard-123?secondary_view=version-history'
      );
    });

    it('should create chat dashboard route with minimal parameters', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        chatId: 'chat-456',
        page: 'dashboard'
      });

      expect(result).toBe('/app/chats/chat-456/dashboards/dashboard-123');
    });

    it('should create non-chat dashboard route with version number', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        dashboardVersionNumber: 7,
        page: 'dashboard'
      });

      expect(result).toBe('/app/dashboards/dashboard-123?dashboard_version_number=7');
    });

    it('should create non-chat dashboard route with version-history secondary view', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        secondaryView: 'version-history',
        page: 'dashboard'
      });

      expect(result).toBe('/app/dashboards/dashboard-123?secondary_view=version-history');
    });

    it('should create non-chat dashboard route with minimal parameters', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        page: 'dashboard'
      });

      expect(result).toBe('/app/dashboards/dashboard-123');
    });
  });

  describe('File page tests', () => {
    it('should create chat dashboard file route with version number', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        chatId: 'chat-456',
        dashboardVersionNumber: 2,
        page: 'file'
      });

      expect(result).toBe(
        '/app/chats/chat-456/dashboards/dashboard-123?dashboard_version_number=2'
      );
    });

    it('should create chat dashboard file route with version-history secondary view', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        chatId: 'chat-456',
        secondaryView: 'version-history',
        page: 'file'
      });

      expect(result).toBe(
        '/app/chats/chat-456/dashboards/dashboard-123?secondary_view=version-history'
      );
    });

    it('should create chat dashboard file route without version number', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        chatId: 'chat-456',
        page: 'file'
      });

      expect(result).toBe('/app/chats/chat-456/dashboards/dashboard-123');
    });

    it('should create non-chat dashboard file route with version number', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        dashboardVersionNumber: 8,
        page: 'file'
      });

      expect(result).toBe('/app/dashboards/dashboard-123?dashboard_version_number=8');
    });

    it('should create non-chat dashboard file route without version number', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        page: 'file'
      });

      expect(result).toBe('/app/dashboards/dashboard-123');
    });
  });

  describe('Edge cases and defaults', () => {
    it('should use default page value when not specified', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        chatId: 'chat-456',
        page: undefined
      });

      expect(result).toBe('/app/chats/chat-456/dashboards/dashboard-123');
    });

    it('should handle undefined secondary view in chat context', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        chatId: 'chat-456',
        secondaryView: undefined,
        page: 'dashboard'
      });

      expect(result).toBe('/app/chats/chat-456/dashboards/dashboard-123');
    });

    it('should handle undefined secondary view in non-chat context', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        secondaryView: undefined,
        page: 'dashboard'
      });

      expect(result).toBe('/app/dashboards/dashboard-123');
    });

    it('should handle undefined page value', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        chatId: 'chat-456',
        page: undefined
      });

      expect(result).toBe('/app/chats/chat-456/dashboards/dashboard-123');
    });
  });

  describe('Parameter combinations', () => {
    it('should handle all optional parameters being undefined', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        chatId: undefined,
        secondaryView: undefined,
        versionNumber: undefined,
        page: 'dashboard'
      } as any);

      expect(result).toBe('/app/dashboards/dashboard-123');
    });

    it('should handle version number 1', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        chatId: 'chat-456',
        dashboardVersionNumber: 1,
        page: 'dashboard'
      });

      expect(result).toBe(
        '/app/chats/chat-456/dashboards/dashboard-123?dashboard_version_number=1'
      );
    });

    it('should handle zero version number', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        chatId: 'chat-456',
        dashboardVersionNumber: 0,
        page: 'dashboard'
      });

      expect(result).toBe('/app/chats/chat-456/dashboards/dashboard-123');
    });

    it('should handle large version numbers', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        chatId: 'chat-456',
        dashboardVersionNumber: 999999,
        page: 'dashboard'
      });

      expect(result).toBe(
        '/app/chats/chat-456/dashboards/dashboard-123?dashboard_version_number=999999'
      );
    });

    it('should handle complex dashboard IDs', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-with-special-chars-123_456-789',
        chatId: 'chat-456',
        page: 'dashboard'
      });

      expect(result).toBe(
        '/app/chats/chat-456/dashboards/dashboard-with-special-chars-123_456-789'
      );
    });

    it('should handle complex chat IDs', () => {
      const result = createDashboardRoute({
        assetId: 'dashboard-123',
        chatId: 'chat-with-special-chars-456_789-012',
        page: 'dashboard'
      });

      expect(result).toBe(
        '/app/chats/chat-with-special-chars-456_789-012/dashboards/dashboard-123'
      );
    });
  });
});
