import { act, renderHook } from '@testing-library/react';
import { useIsMetricChanged, useOriginalMetricStore } from './useOriginalMetricStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { DEFAULT_IBUSTER_METRIC } from '@/api/asset_interfaces/metric/defaults';
import React from 'react';
import type { IBusterMetric } from '@/api/asset_interfaces/metric';

// Utility to create test metrics
const createTestMetric = (id: string, overrides: Partial<IBusterMetric> = {}): IBusterMetric => {
  return {
    ...DEFAULT_IBUSTER_METRIC,
    id,
    ...overrides
  };
};

// Create a wrapper component with QueryClientProvider for the renderHook
const createWrapper = (queryClient: QueryClient) => {
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useIsMetricChanged integration test', () => {
  let queryClient: QueryClient;
  const metricId = 'test-metric-id';
  const originalMetric = createTestMetric(metricId, {
    name: 'Original Name',
    description: 'Original Description'
  });
  
  beforeEach(() => {
    // Reset the store before each test
    act(() => {
      useOriginalMetricStore.setState({
        originalMetrics: {},
        setOriginalMetric: useOriginalMetricStore.getState().setOriginalMetric,
        getOriginalMetric: useOriginalMetricStore.getState().getOriginalMetric,
        removeOriginalMetric: useOriginalMetricStore.getState().removeOriginalMetric
      });
    });
    
    // Set up a fresh QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false
        }
      }
    });
  });
  
  afterEach(() => {
    queryClient.clear();
  });
  
  test('should detect changes when metric is updated', () => {
    // Set up query client with a metric
    queryClient.setQueryData(
      metricsQueryKeys.metricsGetMetric(metricId).queryKey,
      originalMetric
    );
    
    // Store the original metric in Zustand store
    act(() => {
      useOriginalMetricStore.getState().setOriginalMetric(originalMetric);
    });
    
    // Verify initially no changes are detected
    const { result, rerender } = renderHook(
      () => useIsMetricChanged({ metricId }),
      { wrapper: createWrapper(queryClient) }
    );
    
    expect(result.current).toBe(false);
    
    // Update the metric in React Query
    const updatedMetric = {
      ...originalMetric,
      name: 'Updated Name'
    };
    
    act(() => {
      queryClient.setQueryData(
        metricsQueryKeys.metricsGetMetric(metricId).queryKey,
        updatedMetric
      );
    });
    
    // Re-render the hook to get the latest value
    rerender();
    
    // Now it should detect changes
    expect(result.current).toBe(true);
  });
  
  test('should not detect changes for non-tracked properties', () => {
    // Set up query client with a metric
    queryClient.setQueryData(
      metricsQueryKeys.metricsGetMetric(metricId).queryKey,
      originalMetric
    );
    
    // Store the original metric in Zustand store
    act(() => {
      useOriginalMetricStore.getState().setOriginalMetric(originalMetric);
    });
    
    // Verify initially no changes are detected
    const { result, rerender } = renderHook(
      () => useIsMetricChanged({ metricId }),
      { wrapper: createWrapper(queryClient) }
    );
    
    expect(result.current).toBe(false);
    
    // Update a property that's not tracked by the hook
    const updatedMetric = {
      ...originalMetric,
      updated_at: new Date().toISOString()
    };
    
    act(() => {
      queryClient.setQueryData(
        metricsQueryKeys.metricsGetMetric(metricId).queryKey,
        updatedMetric
      );
    });
    
    // Re-render the hook to get the latest value
    rerender();
    
    // It should not detect changes for non-tracked properties
    expect(result.current).toBe(false);
  });
  
  test('should handle undefined values gracefully', () => {
    // Set up an empty query client (no data)
    
    // Try to check a metric that doesn't exist
    const { result } = renderHook(
      () => useIsMetricChanged({ metricId: 'non-existent-id' }),
      { wrapper: createWrapper(queryClient) }
    );
    
    // It should not throw and just return false
    expect(result.current).toBe(false);
  });
}); 