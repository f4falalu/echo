import { beforeEach, describe, expect, it, vi } from 'vitest';
import { webSearch } from './web-search-tool';

vi.mock('@buster/web-tools', () => {
  const mockFirecrawlService = {
    webSearch: vi.fn(),
  };

  return {
    FirecrawlService: vi.fn().mockImplementation(() => mockFirecrawlService),
    mockFirecrawlService,
  };
});

describe('webSearch tool', () => {
  let mockFirecrawlService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { mockFirecrawlService: mock } = vi.mocked(
      await import('@buster/web-tools')
    ) as any;
    mockFirecrawlService = mock;
  });

  it('should transform search results correctly', async () => {
    const mockResponse = {
      success: true,
      results: [
        {
          title: 'Test Result',
          url: 'https://example.com',
          description: 'Test description',
          content: 'Test content',
        },
      ],
    };

    mockFirecrawlService.webSearch.mockResolvedValue(mockResponse);

    const result = await webSearch.execute({
      context: {
        query: 'test query',
        limit: 5,
        scrapeContent: true,
        formats: ['markdown'],
      },
      runtimeContext: {} as any,
    });

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({
      title: 'Test Result',
      url: 'https://example.com',
      description: 'Test description',
      content: 'Test content',
    });
  });

  it('should pass correct options to webSearch method', async () => {
    const mockResponse = {
      success: true,
      results: [],
    };

    mockFirecrawlService.webSearch.mockResolvedValue(mockResponse);

    await webSearch.execute({
      context: {
        query: 'test query',
        limit: 3,
        scrapeContent: true,
        formats: ['html', 'markdown'],
      },
      runtimeContext: {} as any,
    });

    expect(mockFirecrawlService.webSearch).toHaveBeenCalledWith('test query', {
      limit: 3,
      scrapeOptions: {
        formats: ['html', 'markdown'],
      },
    });
  });

  it('should handle errors gracefully', async () => {
    mockFirecrawlService.webSearch.mockRejectedValue(new Error('Search failed'));

    const result = await webSearch.execute({
      context: {
        query: 'test query',
      },
      runtimeContext: {} as any,
    });

    expect(result.success).toBe(false);
    expect(result.results).toEqual([]);
    expect(result.error).toBe('Search failed');
  });

  it('should use default values when options are not provided', async () => {
    const mockResponse = {
      success: true,
      results: [],
    };

    mockFirecrawlService.webSearch.mockResolvedValue(mockResponse);

    await webSearch.execute({
      context: {
        query: 'test query',
      },
      runtimeContext: {} as any,
    });

    expect(mockFirecrawlService.webSearch).toHaveBeenCalledWith('test query', {
      limit: 5,
      scrapeOptions: {
        formats: ['markdown'],
      },
    });
  });
});
