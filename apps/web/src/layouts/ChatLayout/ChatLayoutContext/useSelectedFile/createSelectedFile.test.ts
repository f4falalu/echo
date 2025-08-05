import { describe, expect, it } from 'vitest';
import { createSelectedFile } from './createSelectedFile';
import type { ChatURLParsed } from './parsePathnameSegments';

describe('createSelectedFile', () => {
  it('returns a metric file when metricId is provided', () => {
    const params = {
      metricId: 'metric-123',
      collectionId: 'collection-123',
      datasetId: 'dataset-123'
    } as Parameters<typeof createSelectedFile>[0];

    const result = createSelectedFile(params);

    expect(result).toEqual({
      id: 'metric-123',
      type: 'metric'
    });
  });

  it('returns a dashboard file when dashboardId is provided', () => {
    const params = {
      dashboardId: 'dashboard-456'
    } as Parameters<typeof createSelectedFile>[0];

    const result = createSelectedFile(params);

    expect(result).toEqual({
      id: 'dashboard-456',
      type: 'dashboard'
    });
  });

  it('returns a reasoning file when messageId is provided', () => {
    const params = {
      messageId: 'message-789'
    } as Parameters<typeof createSelectedFile>[0];

    const result = createSelectedFile(params);

    expect(result).toEqual({
      id: 'message-789',
      type: 'reasoning'
    });
  });

  it('returns null when no relevant id is provided', () => {
    const params = {
      chatId: 'chat-123',
      collectionId: 'collection-123',
      datasetId: 'dataset-123'
    } as Parameters<typeof createSelectedFile>[0];

    const result = createSelectedFile(params);

    expect(result).toBeNull();
  });

  it('returns null when params object is empty', () => {
    const params = {} as Parameters<typeof createSelectedFile>[0];

    const result = createSelectedFile(params);

    expect(result).toBeNull();
  });

  it('prioritizes metricId over other ids', () => {
    const params = {
      metricId: 'metric-123',
      dashboardId: 'dashboard-456',
      messageId: 'message-789'
    } as Parameters<typeof createSelectedFile>[0];

    const result = createSelectedFile(params);

    expect(result).toEqual({
      id: 'metric-123',
      type: 'metric'
    });
  });

  it('prioritizes dashboardId over messageId when metricId is not provided', () => {
    const params = {
      dashboardId: 'dashboard-456',
      messageId: 'message-789'
    } as Parameters<typeof createSelectedFile>[0];

    const result = createSelectedFile(params);

    expect(result).toEqual({
      id: 'dashboard-456',
      type: 'dashboard'
    });
  });
});
