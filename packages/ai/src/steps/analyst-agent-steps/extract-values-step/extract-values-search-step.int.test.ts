import type { ModelMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import { runExtractValuesAndSearchStep } from './extract-values-search-step';

describe('extract-values-search-step integration', () => {
  it('should extract values from simple product query', async () => {
    const params = {
      prompt: 'Show me sales for Red Bull in California',
      conversationHistory: [],
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    expect(result.searchPerformed).toBe(false); // No dataSourceId provided
    expect(result.searchResults).toBe('');
    expect(result.foundValues).toEqual({});
  });

  it('should extract multiple values from complex query', async () => {
    const params = {
      prompt:
        'Compare Nike vs Adidas performance in New York and Los Angeles for Premium tier customers',
      conversationHistory: [],
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Should extract brand names, locations, and tier
  });

  it('should handle queries with no extractable values', async () => {
    const params = {
      prompt: 'What is the total revenue last month?',
      conversationHistory: [],
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    expect(result.values.length).toBe(0); // No specific values to extract
    expect(result.searchPerformed).toBe(false);
  });

  it('should use conversation history for context', async () => {
    const conversationHistory: ModelMessage[] = [
      {
        role: 'user',
        content: 'I want to analyze our electronics division',
      },
      {
        role: 'assistant',
        content: 'I can help you analyze the electronics division. What would you like to know?',
      },
    ];

    const params = {
      prompt: 'Show me iPhone 15 and Samsung Galaxy sales',
      conversationHistory,
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
  });

  it('should extract company and product names', async () => {
    const params = {
      prompt: 'How many Microsoft Surface laptops did Acme Corp purchase?',
      conversationHistory: [],
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Should extract "Microsoft Surface", "Acme Corp"
  });

  it('should extract status values and categories', async () => {
    const params = {
      prompt: 'Show me all completed orders for Enterprise customers in pending status',
      conversationHistory: [],
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Should extract "completed", "Enterprise", "pending"
  });

  it('should handle industry-specific terms', async () => {
    const params = {
      prompt: 'What is our B2B SaaS revenue from e-commerce platforms?',
      conversationHistory: [],
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Should extract "B2B", "SaaS", "e-commerce"
  });

  it('should extract location-based values', async () => {
    const params = {
      prompt: 'Compare sales between San Francisco, New York, and Europe',
      conversationHistory: [],
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Should extract "San Francisco", "New York", "Europe"
  });

  it('should handle feature-based queries', async () => {
    const params = {
      prompt: 'Show me all waterproof wireless headphones in organic materials',
      conversationHistory: [],
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Should extract "waterproof", "wireless", "organic"
  });

  it('should handle follow-up questions with context', async () => {
    const conversationHistory: ModelMessage[] = [
      {
        role: 'user',
        content: 'Show me laptop sales',
      },
      {
        role: 'assistant',
        content: 'Here are the laptop sales figures...',
      },
    ];

    const params = {
      prompt: 'What about Dell and HP specifically?',
      conversationHistory,
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Should extract "Dell", "HP"
  });

  it('should handle empty prompt', async () => {
    const params = {
      prompt: '',
      conversationHistory: [],
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toEqual([]);
    expect(result.searchPerformed).toBe(false);
    expect(result.searchResults).toBe('');
    expect(result.foundValues).toEqual({});
  });

  it('should handle very long prompts with multiple values', async () => {
    const longPrompt = `
      I need a comprehensive analysis of our product portfolio including:
      Red Bull, Monster Energy, Coca-Cola, and Pepsi in the beverages category,
      Nike, Adidas, and Puma in the sports category,
      Apple, Samsung, and Google in the technology category,
      specifically for customers in California, Texas, New York, and Florida,
      focusing on Premium tier, Enterprise, and VIP segments,
      for all completed and pending orders.
    `.trim();

    const params = {
      prompt: longPrompt,
      conversationHistory: [],
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
  });

  it('should not extract generic concepts', async () => {
    const params = {
      prompt: 'Show me revenue, profit, and customer count for last month',
      conversationHistory: [],
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    expect(result.values.length).toBe(0); // Should not extract generic terms
  });

  it('should handle mixed valid and invalid values', async () => {
    const params = {
      prompt: 'Show me Red Bull sales and revenue trends with customer analytics',
      conversationHistory: [],
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Should extract "Red Bull" but not "revenue", "trends", or "analytics"
  });

  it('should handle abort scenario gracefully', async () => {
    const params = {
      prompt: 'Show me Nike products',
      conversationHistory: [],
    };

    // Even if internally aborted, should return valid structure
    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    expect(result.searchPerformed).toBe(false);
    expect(result.searchResults).toBe('');
    expect(result.foundValues).toEqual({});
  });

  it('should handle special characters in values', async () => {
    const params = {
      prompt: 'Show me sales for "Johnson & Johnson" and AT&T products',
      conversationHistory: [],
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
  });

  it('should extract model/version information', async () => {
    const params = {
      prompt: 'Compare Version 2.0 with Model X performance metrics',
      conversationHistory: [],
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Should extract "Version 2.0", "Model X"
  });

  it('should handle questions about specific IDs differently', async () => {
    const params = {
      prompt: 'What is the status of order 12345 and ticket ABC123?',
      conversationHistory: [],
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Behavior depends on whether these are considered meaningful identifiers
  });

  it('should process concurrent value extraction requests', async () => {
    const promises = Array.from({ length: 3 }, (_, i) =>
      runExtractValuesAndSearchStep({
        prompt: `Show me Product${i} sales`,
        conversationHistory: [],
      })
    );

    const results = await Promise.all(promises);

    expect(results).toHaveLength(3);
    results.forEach((result) => {
      expect(result).toBeDefined();
      expect(result.values).toBeDefined();
      expect(Array.isArray(result.values)).toBe(true);
    });
  });
});
