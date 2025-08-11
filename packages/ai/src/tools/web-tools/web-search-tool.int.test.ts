import { beforeEach, describe, expect, it } from 'vitest';
import { createWebSearchTool } from './web-search-tool';

describe('webSearch tool integration', () => {
  let webSearchTool: ReturnType<typeof createWebSearchTool>;

  beforeEach(() => {
    if (!process.env.FIRECRAWL_API_KEY) {
      console.warn('Skipping integration tests - FIRECRAWL_API_KEY not set');
    }
    webSearchTool = createWebSearchTool();
  });

  it.skipIf(!process.env.FIRECRAWL_API_KEY)(
    'should perform actual web search and return results',
    async () => {
      const result = await webSearchTool.execute({
        query: 'Buster Data',
        limit: 10,
        scrapeContent: true,
        formats: ['markdown'],
      });

      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);

      if (result.results.length > 0) {
        const firstResult = result.results[0]!;
        expect(firstResult).toHaveProperty('title');
        expect(firstResult).toHaveProperty('url');
        expect(firstResult).toHaveProperty('description');
        expect(typeof firstResult.title).toBe('string');
        expect(typeof firstResult.url).toBe('string');
        expect(typeof firstResult.description).toBe('string');
      }
    },
    30000
  );

  it.skipIf(!process.env.FIRECRAWL_API_KEY)(
    'should handle search with minimal options',
    async () => {
      const result = await webSearchTool.execute({
        query: 'TypeScript',
      });

      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    },
    30000
  );
});
