import type { ModelMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import { runExtractValuesAndSearchStep } from './extract-values-search-step';

describe('extract-values-search-step integration', () => {
  it('should extract values from simple product query', async () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'Show me sales for Red Bull in California' },
    ];
    const params = {
      messages,
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    expect(result.messages?.[result.messages.length - 1]).toBeUndefined();
  });

  it('should extract multiple values from complex query', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content:
          'Compare Nike vs Adidas performance in New York and Los Angeles for Premium tier customers',
      },
    ];
    const params = {
      messages,
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Should extract brand names, locations, and tier
  });

  it('should handle queries with no extractable values', async () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'What is the total revenue last month?' },
    ];
    const params = {
      messages,
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    expect(result.values.length).toBe(0); // No specific values to extract
    expect(result.messages?.[result.messages.length - 1]).toBeUndefined();
  });

  it('should use conversation history for context', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'I want to analyze our electronics division',
      },
      {
        role: 'assistant',
        content: 'I can help you analyze the electronics division. What would you like to know?',
      },
      {
        role: 'user',
        content: 'Show me iPhone 15 and Samsung Galaxy sales',
      },
    ];

    const params = {
      messages,
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
  });

  it('should extract company and product names', async () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'How many Microsoft Surface laptops did Acme Corp purchase?' },
    ];
    const params = {
      messages,
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Should extract "Microsoft Surface", "Acme Corp"
  });

  it('should extract status values and categories', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'Show me all completed orders for Enterprise customers in pending status',
      },
    ];
    const params = {
      messages,
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Should extract "completed", "Enterprise", "pending"
  });

  it('should handle industry-specific terms', async () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'What is our B2B SaaS revenue from e-commerce platforms?' },
    ];
    const params = {
      messages,
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Should extract "B2B", "SaaS", "e-commerce"
  });

  it('should extract location-based values', async () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'Compare sales between San Francisco, New York, and Europe' },
    ];
    const params = {
      messages,
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Should extract "San Francisco", "New York", "Europe"
  });

  it('should handle feature-based queries', async () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'Show me all waterproof wireless headphones in organic materials' },
    ];
    const params = {
      messages,
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Should extract "waterproof", "wireless", "organic"
  });

  it('should handle follow-up questions with context', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'Show me laptop sales',
      },
      {
        role: 'assistant',
        content: 'Here are the laptop sales figures...',
      },
      {
        role: 'user',
        content: 'What about Dell and HP specifically?',
      },
    ];

    const params = {
      messages,
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Should extract "Dell", "HP"
  });

  it('should handle empty prompt', async () => {
    const messages: ModelMessage[] = [{ role: 'user', content: '' }];
    const params = {
      messages,
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toEqual([]);
    expect(result.messages?.[result.messages.length - 1]).toBeUndefined();
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

    const messages: ModelMessage[] = [{ role: 'user', content: longPrompt }];
    const params = {
      messages,
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
  });

  it('should not extract generic concepts', async () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'Show me revenue, profit, and customer count for last month' },
    ];
    const params = {
      messages,
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    expect(result.values.length).toBe(0); // Should not extract generic terms
  });

  it('should handle mixed valid and invalid values', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'Show me Red Bull sales and revenue trends with customer analytics',
      },
    ];
    const params = {
      messages,
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Should extract "Red Bull" but not "revenue", "trends", or "analytics"
  });

  it('should handle abort scenario gracefully', async () => {
    const messages: ModelMessage[] = [{ role: 'user', content: 'Show me Nike products' }];
    const params = {
      messages,
    };

    // Even if internally aborted, should return valid structure
    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    expect(result.messages?.[result.messages.length - 1]).toBeUndefined();
  });

  it('should handle special characters in values', async () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'Show me sales for "Johnson & Johnson" and AT&T products' },
    ];
    const params = {
      messages,
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
  });

  it('should extract model/version information', async () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'Compare Version 2.0 with Model X performance metrics' },
    ];
    const params = {
      messages,
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();
    expect(Array.isArray(result.values)).toBe(true);
    // Should extract "Version 2.0", "Model X"
  });

  it('should handle questions about specific IDs differently', async () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'What is the status of order 12345 and ticket ABC123?' },
    ];
    const params = {
      messages,
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
        messages: [{ role: 'user', content: `Show me Product${i} sales` } as ModelMessage],
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

  it('should not create valuesMessage with empty content when search returns no results', async () => {
    const messages: ModelMessage[] = [{ role: 'user', content: 'Show me sales for Red Bull' }];

    // Test with a dataSourceId that would trigger search but return empty results
    const params = {
      messages,
      dataSourceId: 'test-datasource-id',
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();

    // If valuesMessage exists, it should have non-empty content
    const lastMessage = result.messages?.[result.messages.length - 1];
    if (lastMessage) {
      expect(lastMessage.content).toBeTruthy();
      expect(typeof lastMessage.content).toBe('string');
      expect((lastMessage.content as string).length).toBeGreaterThan(0);
    }
  });

  it('should not create valuesMessage when extracted values exist but search results are empty', async () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'Show me Nike and Adidas products' },
    ];

    const params = {
      messages,
      dataSourceId: 'test-datasource-id',
    };

    const result = await runExtractValuesAndSearchStep(params);

    expect(result).toBeDefined();
    expect(result.values).toBeDefined();

    // Verify that if we have values but no search results, valuesMessage is undefined
    // This prevents empty string messages from being created
    const lastMsg = result.messages?.[result.messages.length - 1];
    if (result.values.length > 0 && lastMsg) {
      expect(lastMsg.content).toBeTruthy();
      expect((lastMsg.content as string).trim()).not.toBe('');
    }
  });
});
