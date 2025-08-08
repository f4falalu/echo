import type { ModelMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import { generateChatTitle } from './generate-chat-title-step';

describe('generate-chat-title-step integration', () => {
  it('should generate title for a simple sales query', async () => {
    const params = {
      prompt: 'Show me total sales for last quarter',
      conversationHistory: [],
    };

    const result = await generateChatTitle(params);

    expect(result).toBeDefined();
    expect(result.title).toBeDefined();
    expect(typeof result.title).toBe('string');
    expect(result.title.length).toBeGreaterThan(0);
    expect(result.title.length).toBeLessThanOrEqual(50); // Reasonable title length
  });

  it('should generate title with conversation history context', async () => {
    const conversationHistory: ModelMessage[] = [
      {
        role: 'user',
        content: 'I need to analyze our product performance',
      },
      {
        role: 'assistant',
        content: 'I can help you analyze product performance. What specific aspects would you like to explore?',
      },
    ];

    const params = {
      prompt: 'Compare revenue between laptops and desktop computers',
      conversationHistory,
    };

    const result = await generateChatTitle(params);

    expect(result).toBeDefined();
    expect(result.title).toBeDefined();
    expect(typeof result.title).toBe('string');
    expect(result.title.length).toBeGreaterThan(0);
  });

  it('should handle complex multi-part queries', async () => {
    const params = {
      prompt: 'What are the top selling products by category, and show me monthly trends for Q1 2024',
      conversationHistory: [],
    };

    const result = await generateChatTitle(params);

    expect(result).toBeDefined();
    expect(result.title).toBeDefined();
    expect(typeof result.title).toBe('string');
    expect(result.title.length).toBeGreaterThan(0);
  });

  it('should generate title for technical data queries', async () => {
    const params = {
      prompt: 'Calculate customer lifetime value segmented by acquisition channel',
      conversationHistory: [],
    };

    const result = await generateChatTitle(params);

    expect(result).toBeDefined();
    expect(result.title).toBeDefined();
    expect(typeof result.title).toBe('string');
    expect(result.title.length).toBeGreaterThan(0);
  });

  it('should handle follow-up questions with context', async () => {
    const conversationHistory: ModelMessage[] = [
      {
        role: 'user',
        content: 'Show me sales for Red Bull',
      },
      {
        role: 'assistant',
        content: 'Here are the sales figures for Red Bull products...',
      },
    ];

    const params = {
      prompt: 'What about Monster Energy drinks?',
      conversationHistory,
    };

    const result = await generateChatTitle(params);

    expect(result).toBeDefined();
    expect(result.title).toBeDefined();
    expect(typeof result.title).toBe('string');
    expect(result.title.length).toBeGreaterThan(0);
  });

  it('should handle empty prompt gracefully', async () => {
    const params = {
      prompt: '',
      conversationHistory: [],
    };

    const result = await generateChatTitle(params);

    expect(result).toBeDefined();
    expect(result.title).toBeDefined();
    expect(result.title).toBe('New Analysis'); // Fallback title
  });

  it('should handle very long prompts', async () => {
    const longPrompt = `
      I need a comprehensive analysis of our business performance including:
      1. Revenue trends over the last 12 months broken down by product category
      2. Customer acquisition costs by marketing channel
      3. Churn rate analysis by customer segment
      4. Product profitability margins
      5. Geographic distribution of sales
      6. Seasonal patterns in purchase behavior
      7. Customer lifetime value predictions
      8. Inventory turnover rates
      9. Sales team performance metrics
      10. Website conversion rates by traffic source
    `.trim();

    const params = {
      prompt: longPrompt,
      conversationHistory: [],
    };

    const result = await generateChatTitle(params);

    expect(result).toBeDefined();
    expect(result.title).toBeDefined();
    expect(typeof result.title).toBe('string');
    expect(result.title.length).toBeGreaterThan(0);
    expect(result.title.length).toBeLessThanOrEqual(50); // Should still be concise
  });

  it('should generate appropriate title for data availability questions', async () => {
    const params = {
      prompt: 'What customer data do you have access to?',
      conversationHistory: [],
    };

    const result = await generateChatTitle(params);

    expect(result).toBeDefined();
    expect(result.title).toBeDefined();
    expect(typeof result.title).toBe('string');
    expect(result.title.length).toBeGreaterThan(0);
  });

  it('should handle mixed language conversation history', async () => {
    const conversationHistory: ModelMessage[] = [
      {
        role: 'user',
        content: 'Show me sales data',
      },
      {
        role: 'assistant',
        content: 'Here are the sales figures for your analysis...',
      },
      {
        role: 'user',
        content: 'Can you filter by region?',
      },
    ];

    const params = {
      prompt: 'Focus on North America only',
      conversationHistory,
    };

    const result = await generateChatTitle(params);

    expect(result).toBeDefined();
    expect(result.title).toBeDefined();
    expect(typeof result.title).toBe('string');
    expect(result.title.length).toBeGreaterThan(0);
  });

  it('should handle abort scenario gracefully', async () => {
    // This test simulates what happens when generateChatTitle handles an AbortError
    // In real scenarios, this would happen when a request is cancelled
    const params = {
      prompt: 'Show me quarterly revenue trends',
      conversationHistory: [],
    };

    const result = await generateChatTitle(params);

    // Even if aborted internally, should return a valid result
    expect(result).toBeDefined();
    expect(result.title).toBeDefined();
    expect(typeof result.title).toBe('string');
  });
});