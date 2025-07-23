import {
  FirecrawlService,
  type WebSearchOptions,
  type WebSearchResult,
} from '@buster-tools/web-tools';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

const inputSchema = z.object({
  query: z.string().min(1, 'Search query is required').describe('The search query to execute'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .describe('Maximum number of search results to return (default: 5)'),
  scrapeContent: z
    .boolean()
    .optional()
    .describe('Whether to scrape content from search results (default: true)'),
  formats: z
    .array(z.enum(['markdown', 'html', 'rawHtml', 'links', 'screenshot']))
    .optional()
    .describe('Content formats to scrape (default: ["markdown"])'),
});

const outputSchema = z.object({
  success: z.boolean().describe('Whether the search was successful'),
  results: z
    .array(
      z.object({
        title: z.string().describe('Title of the search result'),
        url: z.string().describe('URL of the search result'),
        description: z.string().describe('Description of the search result'),
        content: z.string().optional().describe('Scraped content from the result (if available)'),
      })
    )
    .describe('Array of search results'),
  error: z.string().optional().describe('Error message if the search failed'),
});

type WebSearchInput = z.infer<typeof inputSchema>;
type WebSearchOutput = z.infer<typeof outputSchema>;

async function executeWebSearch(
  input: WebSearchInput,
  _context: RuntimeContext
): Promise<WebSearchOutput> {
  try {
    const firecrawlService = new FirecrawlService();

    const searchOptions: WebSearchOptions = {
      limit: input.limit || 5,
      ...(input.scrapeContent !== false && {
        scrapeOptions: {
          formats: input.formats || ['markdown'],
        },
      }),
    };

    const response = await firecrawlService.webSearch(input.query, searchOptions);

    const transformedResults = response.results.map((result: WebSearchResult) => ({
      title: result.title,
      url: result.url,
      description: result.description,
      ...(result.content && { content: result.content }),
    }));

    return {
      success: response.success,
      results: transformedResults,
    };
  } catch (error) {
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

const executeWebSearchTraced = wrapTraced(executeWebSearch, { name: 'web-search-tool' });

export const webSearch = createTool({
  id: 'web-search',
  description:
    'Search the web for information using Firecrawl. Returns search results with titles, URLs, descriptions, and optionally scraped content. Useful for finding current information, research, and web content.',
  inputSchema,
  outputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: WebSearchInput;
    runtimeContext: RuntimeContext;
  }) => {
    return await executeWebSearchTraced(context, runtimeContext);
  },
});

export default webSearch;
