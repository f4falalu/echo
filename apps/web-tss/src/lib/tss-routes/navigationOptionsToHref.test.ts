import { describe, expect, it } from 'vitest';
import type { BusterNavigateOptions } from '../tss-routes';
import { routeToHref } from '../tss-routes';

describe('navigationOptionsToHref', () => {
  it('should convert simple route with single param', () => {
    const options: BusterNavigateOptions = {
      to: '/app/chats/$chatId',
      params: {
        chatId: '123',
      },
    };

    const href = routeToHref(options);
    expect(href).toBe('/app/chats/123');
  });

  it('should convert route with multiple params', () => {
    const options: BusterNavigateOptions = {
      to: '/app/chats/$chatId/dashboard/$dashboardId',
      params: {
        chatId: 'chat-123',
        dashboardId: 'dash-456',
      },
    };

    const href = routeToHref(options);
    expect(href).toBe('/app/chats/chat-123/dashboard/dash-456');
  });

  it('should convert complex nested route', () => {
    const options: BusterNavigateOptions = {
      to: '/app/chats/$chatId/dashboard/$dashboardId/metrics/$metricId',
      params: {
        chatId: 'chat-123',
        dashboardId: 'dash-456',
        metricId: 'metric-789',
      },
    };

    const href = routeToHref(options);
    expect(href).toBe('/app/chats/chat-123/dashboard/dash-456/metrics/metric-789');
  });

  it('should handle URL encoding for special characters', () => {
    const options: BusterNavigateOptions = {
      to: '/app/chats/$chatId',
      params: {
        chatId: 'chat with spaces & special',
      },
    };

    const href = routeToHref(options);
    expect(href).toBe('/app/chats/chat%20with%20spaces%20%26%20special');
  });

  it('should add search params when provided', () => {
    const options: BusterNavigateOptions = {
      to: '/app/chats/$chatId',
      params: {
        chatId: '123',
      },
      search: {
        filter: 'active',
        sort: 'date',
      },
    };

    const href = routeToHref(options);
    expect(href).toBe('/app/chats/123?filter=active&sort=date');
  });

  it('should add hash when provided', () => {
    const options: BusterNavigateOptions = {
      to: '/app/chats/$chatId',
      params: {
        chatId: '123',
      },
      hash: 'section-1',
    };

    const href = routeToHref(options);
    expect(href).toBe('/app/chats/123#section-1');
  });

  it('should handle search params and hash together', () => {
    const options: BusterNavigateOptions = {
      to: '/app/chats/$chatId',
      params: {
        chatId: '123',
      },
      search: {
        tab: 'settings',
      },
      hash: 'privacy',
    };

    const href = routeToHref(options);
    expect(href).toBe('/app/chats/123?tab=settings#privacy');
  });

  it('should work with toHref alias', () => {
    const options: BusterNavigateOptions = {
      to: '/app/metrics/$metricId',
      params: {
        metricId: 'metric-123',
      },
    };

    const href = routeToHref(options);
    expect(href).toBe('/app/metrics/metric-123');
  });

  it('should handle routes without params', () => {
    const options: BusterNavigateOptions = {
      to: '/app/home',
    };

    const href = routeToHref(options);
    expect(href).toBe('/app/home');
  });

  it('should handle params that appear multiple times in different positions', () => {
    // Test with a route that has repeated param patterns
    const options: BusterNavigateOptions = {
      to: '/app/chats/$chatId/report/$reportId',
      params: {
        chatId: '123',
        reportId: 'report-456',
      },
    };

    const href = routeToHref(options);
    expect(href).toBe('/app/chats/123/report/report-456');
  });
});
