import { Store, useStore } from '@tanstack/react-store';
import type { BusterMetric } from '@/api/asset_interfaces/metric';

const originalMetricStore = new Store(new Map<string, BusterMetric>());

export const setOriginalMetric = (metric: BusterMetric) => {
  originalMetricStore.setState((prev) => new Map(prev).set(metric.id, metric));
};

export const getOriginalMetric = (metricId: string) => {
  return originalMetricStore.state.get(metricId);
};

export const removeOriginalMetric = (metricId: string) => {
  originalMetricStore.setState((prev) => {
    const newState = new Map(prev);
    newState.delete(metricId);
    return newState;
  });
};

export const useOriginalMetricStore = () => {
  return useStore(originalMetricStore);
};

const stableSelectOriginalMetric = (metricId: string) => {
  return (state: Map<string, BusterMetric>) => state.get(metricId);
};

export const useGetOriginalMetric = (metricId: string) => {
  return useStore(originalMetricStore, stableSelectOriginalMetric(metricId));
};
