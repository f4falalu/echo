import { describe, it, expect, vi } from 'vitest';
import { createDatasetRoute } from './createDatasetRoute';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';

// Mock the dependencies
vi.mock('@/routes/busterRoutes', () => ({
  BusterRoutes: {
    APP_DATASETS_ID: '/app/datasets/:datasetId'
  },
  createBusterRoute: vi.fn()
}));

describe('createDatasetRoute', () => {
  const mockCreateBusterRoute = vi.mocked(createBusterRoute);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call createBusterRoute with correct parameters when both datasetId and chatId are provided', () => {
    const datasetId = 'test-dataset-123';
    const chatId = 'test-chat-456';
    const expectedRoute = '/app/datasets/test-dataset-123';

    mockCreateBusterRoute.mockReturnValue(expectedRoute);

    const result = createDatasetRoute({ datasetId, chatId });

    expect(mockCreateBusterRoute).toHaveBeenCalledWith({
      route: BusterRoutes.APP_DATASETS_ID,
      datasetId
    });
    expect(result).toBe(expectedRoute);
  });

  it('should call createBusterRoute with correct parameters when chatId is undefined', () => {
    const datasetId = 'test-dataset-123';
    const chatId = undefined;
    const expectedRoute = '/app/datasets/test-dataset-123';

    mockCreateBusterRoute.mockReturnValue(expectedRoute);

    const result = createDatasetRoute({ datasetId, chatId });

    expect(mockCreateBusterRoute).toHaveBeenCalledWith({
      route: BusterRoutes.APP_DATASETS_ID,
      datasetId
    });
    expect(result).toBe(expectedRoute);
  });

  it('should call createBusterRoute with correct parameters when chatId is empty string', () => {
    const datasetId = 'test-dataset-123';
    const chatId = '';
    const expectedRoute = '/app/datasets/test-dataset-123';

    mockCreateBusterRoute.mockReturnValue(expectedRoute);

    const result = createDatasetRoute({ datasetId, chatId });

    expect(mockCreateBusterRoute).toHaveBeenCalledWith({
      route: BusterRoutes.APP_DATASETS_ID,
      datasetId
    });
    expect(result).toBe(expectedRoute);
  });

  it('should handle datasetId with special characters', () => {
    const datasetId = 'dataset-with-special-chars-123!@#';
    const chatId = 'test-chat-456';
    const expectedRoute = '/app/datasets/dataset-with-special-chars-123!@#';

    mockCreateBusterRoute.mockReturnValue(expectedRoute);

    const result = createDatasetRoute({ datasetId, chatId });

    expect(mockCreateBusterRoute).toHaveBeenCalledWith({
      route: BusterRoutes.APP_DATASETS_ID,
      datasetId
    });
    expect(result).toBe(expectedRoute);
  });

  it('should handle empty datasetId', () => {
    const datasetId = '';
    const chatId = 'test-chat-456';
    const expectedRoute = '/app/datasets/';

    mockCreateBusterRoute.mockReturnValue(expectedRoute);

    const result = createDatasetRoute({ datasetId, chatId });

    expect(mockCreateBusterRoute).toHaveBeenCalledWith({
      route: BusterRoutes.APP_DATASETS_ID,
      datasetId
    });
    expect(result).toBe(expectedRoute);
  });

  it('should verify that chatId parameter is not used in the route creation', () => {
    const datasetId = 'test-dataset-123';
    const chatId = 'unused-chat-id';

    createDatasetRoute({ datasetId, chatId });

    // Verify that createBusterRoute is called with only route and datasetId
    expect(mockCreateBusterRoute).toHaveBeenCalledWith({
      route: BusterRoutes.APP_DATASETS_ID,
      datasetId
    });

    // Verify that chatId is not passed to createBusterRoute
    const callArgs = mockCreateBusterRoute.mock.calls[0][0];
    expect(callArgs).not.toHaveProperty('chatId');
  });
});
