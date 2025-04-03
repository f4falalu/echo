import { renderHook, act } from '@testing-library/react';
import { useIsMetricChanged, useOriginalMetricStore } from './useOriginalMetricStore';
import { useQueryClient } from '@tanstack/react-query';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { compareObjectsByKeys } from '@/lib/objects';
import type { IBusterMetric } from '@/api/asset_interfaces/metric';
import { DEFAULT_IBUSTER_METRIC } from '@/api/asset_interfaces/metric/defaults';

// Mock dependencies
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn()
}));

jest.mock('@/api/query_keys/metric', () => ({
  metricsQueryKeys: {
    metricsGetMetric: jest.fn().mockImplementation((metricId) => ({
      queryKey: ['metrics', 'get', metricId, 'latest']
    }))
  }
}));

jest.mock('@/lib/objects', () => ({
  compareObjectsByKeys: jest.fn()
}));

// Create a mock metric factory
const createMockMetric = (id: string, overrides: Partial<IBusterMetric> = {}): IBusterMetric => {
  return {
    ...DEFAULT_IBUSTER_METRIC,
    id,
    ...overrides
  };
};

describe('useOriginalMetricStore', () => {
  beforeEach(() => {
    // Reset the store to initial state before each test
    act(() => {
      useOriginalMetricStore.setState({
        originalMetrics: {},
        setOriginalMetric: useOriginalMetricStore.getState().setOriginalMetric,
        getOriginalMetric: useOriginalMetricStore.getState().getOriginalMetric,
        removeOriginalMetric: useOriginalMetricStore.getState().removeOriginalMetric
      });
    });
  });

  test('should initially have an empty metrics store', () => {
    const { result } = renderHook(() => useOriginalMetricStore());
    expect(result.current.originalMetrics).toEqual({});
  });

  test('should set a metric in the store', () => {
    const testMetric = createMockMetric('test-metric-1', {
      name: 'Test Metric',
      description: 'A test metric',
      chart_config: {
        ...DEFAULT_IBUSTER_METRIC.chart_config,
        showLegend: true
      }
    });

    const { result } = renderHook(() => useOriginalMetricStore());

    act(() => {
      result.current.setOriginalMetric(testMetric);
    });

    expect(result.current.originalMetrics).toHaveProperty('test-metric-1');
    expect(result.current.originalMetrics['test-metric-1']).toEqual(testMetric);
  });

  test('should get a metric from the store', () => {
    const testMetric = createMockMetric('test-metric-1', {
      name: 'Test Metric',
      description: 'A test metric',
      chart_config: {
        ...DEFAULT_IBUSTER_METRIC.chart_config,
        gridLines: false
      }
    });

    const { result } = renderHook(() => useOriginalMetricStore());

    act(() => {
      result.current.setOriginalMetric(testMetric);
    });

    expect(result.current.getOriginalMetric('test-metric-1')).toEqual(testMetric);
    expect(result.current.getOriginalMetric('non-existent')).toBeUndefined();
  });

  test('should remove a metric from the store', () => {
    const testMetric1 = createMockMetric('test-metric-1', {
      name: 'Test Metric 1'
    });

    const testMetric2 = createMockMetric('test-metric-2', {
      name: 'Test Metric 2'
    });

    const { result } = renderHook(() => useOriginalMetricStore());

    act(() => {
      result.current.setOriginalMetric(testMetric1);
      result.current.setOriginalMetric(testMetric2);
    });

    expect(Object.keys(result.current.originalMetrics)).toHaveLength(2);

    act(() => {
      result.current.removeOriginalMetric('test-metric-1');
    });

    expect(Object.keys(result.current.originalMetrics)).toHaveLength(1);
    expect(result.current.originalMetrics).not.toHaveProperty('test-metric-1');
    expect(result.current.originalMetrics).toHaveProperty('test-metric-2');
  });

  test('should update an existing metric in the store', () => {
    const testMetric = createMockMetric('test-metric-1', {
      name: 'Test Metric',
      description: 'A test metric',
      chart_config: {
        ...DEFAULT_IBUSTER_METRIC.chart_config,
        showLegend: true
      }
    });

    const updatedMetric = createMockMetric('test-metric-1', {
      name: 'Updated Metric',
      description: 'An updated test metric',
      chart_config: {
        ...DEFAULT_IBUSTER_METRIC.chart_config,
        showLegend: false
      }
    });

    const { result } = renderHook(() => useOriginalMetricStore());

    act(() => {
      result.current.setOriginalMetric(testMetric);
    });

    expect(result.current.originalMetrics['test-metric-1']).toEqual(testMetric);

    act(() => {
      result.current.setOriginalMetric(updatedMetric);
    });

    expect(result.current.originalMetrics['test-metric-1']).toEqual(updatedMetric);
  });
});

describe('useIsMetricChanged', () => {
  const metricId = 'test-metric-id';
  const mockGetOriginalMetric = jest.fn();
  const mockQueryData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the Zustand store
    jest.spyOn(useOriginalMetricStore, 'getState').mockImplementation(() => ({
      originalMetrics: {},
      setOriginalMetric: jest.fn(),
      getOriginalMetric: mockGetOriginalMetric,
      removeOriginalMetric: jest.fn()
    }));

    // Mock React Query client
    (useQueryClient as jest.Mock).mockImplementation(() => ({
      getQueryData: mockQueryData
    }));
  });

  test('should return false when originalMetric is undefined', () => {
    mockGetOriginalMetric.mockReturnValueOnce(undefined);
    mockQueryData.mockReturnValueOnce({});

    const { result } = renderHook(() => useIsMetricChanged({ metricId }));

    expect(result.current).toBe(false);
    expect(mockGetOriginalMetric).toHaveBeenCalledWith(metricId);
  });

  test('should return false when currentMetric is undefined', () => {
    mockGetOriginalMetric.mockReturnValueOnce(createMockMetric(metricId));
    mockQueryData.mockReturnValueOnce(undefined);

    const { result } = renderHook(() => useIsMetricChanged({ metricId }));

    expect(result.current).toBe(false);
    expect(mockQueryData).toHaveBeenCalledWith(['metrics', 'get', metricId, 'latest']);
  });

  test('should return false when metrics are equal', () => {
    const originalMetric = createMockMetric(metricId, {
      name: 'Test Metric',
      description: 'A test metric',
      chart_config: {
        ...DEFAULT_IBUSTER_METRIC.chart_config,
        colors: DEFAULT_IBUSTER_METRIC.chart_config.colors
      }
    });

    const currentMetric = { ...originalMetric };

    mockGetOriginalMetric.mockReturnValueOnce(originalMetric);
    mockQueryData.mockReturnValueOnce(currentMetric);
    (compareObjectsByKeys as jest.Mock).mockReturnValueOnce(true);

    const { result } = renderHook(() => useIsMetricChanged({ metricId }));

    expect(result.current).toBe(false);
    expect(compareObjectsByKeys).toHaveBeenCalledWith(originalMetric, currentMetric, [
      'name',
      'description',
      'chart_config',
      'file'
    ]);
  });

  test('should return true when metrics have differences', () => {
    const originalMetric = createMockMetric(metricId, {
      name: 'Test Metric',
      description: 'A test metric',
      chart_config: {
        ...DEFAULT_IBUSTER_METRIC.chart_config,
        showLegend: true
      }
    });

    const currentMetric = {
      ...originalMetric,
      name: 'Updated Metric Name'
    };

    mockGetOriginalMetric.mockReturnValueOnce(originalMetric);
    mockQueryData.mockReturnValueOnce(currentMetric);
    (compareObjectsByKeys as jest.Mock).mockReturnValueOnce(false);

    const { result } = renderHook(() => useIsMetricChanged({ metricId }));

    expect(result.current).toBe(true);
    expect(compareObjectsByKeys).toHaveBeenCalledWith(originalMetric, currentMetric, [
      'name',
      'description',
      'chart_config',
      'file'
    ]);
  });

  test('should check only specified properties', () => {
    const originalMetric = createMockMetric(metricId, {
      name: 'Test Metric',
      description: 'A test metric',
      chart_config: {
        ...DEFAULT_IBUSTER_METRIC.chart_config,
        gridLines: false
      },
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    });

    const currentMetric = {
      ...originalMetric,
      updated_at: '2023-01-02' // This change should be ignored
    };

    mockGetOriginalMetric.mockReturnValueOnce(originalMetric);
    mockQueryData.mockReturnValueOnce(currentMetric);
    (compareObjectsByKeys as jest.Mock).mockReturnValueOnce(true);

    const { result } = renderHook(() => useIsMetricChanged({ metricId }));

    expect(result.current).toBe(false);
    expect(compareObjectsByKeys).toHaveBeenCalledWith(originalMetric, currentMetric, [
      'name',
      'description',
      'chart_config',
      'file'
    ]);
  });
});
