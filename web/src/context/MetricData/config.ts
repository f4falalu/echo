import type { BusterMetricData } from '../Metrics';

export const DEFAULT_MESSAGE_DATA: BusterMetricData = {
  fetched: false,
  fetching: false,
  fetchedAt: 0,
  data_metadata: null,
  code: null,
  error: null
};
