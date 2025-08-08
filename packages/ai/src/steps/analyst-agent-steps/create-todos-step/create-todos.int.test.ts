import type { ModelMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import { runCreateTodosStep } from './create-todos-step';

describe('create-todos-step integration', () => {
  it('should create todos for basic sales query', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'What is the total sales for last quarter?',
      },
    ];

    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    expect(result.todos).toContain('[ ]');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant'); // Should contain checkbox format
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    expect(result.todosMessage.content).toBe(result.todos);
  });

  it('should create todos for complex multi-part request', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'Show me top selling products by category, and monthly trends for Q1 2024',
      },
    ];

    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    expect(result.todos).toContain('[ ]');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
  });

  it('should create todos for specific entity queries', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: "What is Baltic Born's return rate this month?",
      },
    ];

    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should contain todos about identifying Baltic Born, return rate, and time period
  });

  it('should handle customer analysis requests', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'How many customers do we have?',
      },
    ];

    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    expect(result.todos).toContain('[ ]');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
  });

  it('should create todos for merchant ranking queries', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content:
          'There are around 400-450 teams using shop on-site. Can you get me the 30 biggest merchants?',
      },
    ];

    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should include todos about identifying merchants, metrics, filtering, and sorting
  });

  it('should handle data availability questions', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'What data do you have access to currently in regards to hubspot?',
      },
    ];

    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
  });

  it('should handle vague requests appropriately', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'Show me important stuff',
      },
    ];

    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should create todos about determining what "important stuff" means
  });

  it('should create todos for dashboard creation requests', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content:
          'Get me our monthly sales and also 5 other charts that show me monthly sales with various groupings',
      },
    ];

    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should include todos about charts and groupings
  });

  it('should handle forecast requests with limitations', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content:
          'What will sales be in Q4. Oh and can you give me a separate line chart that shows me monthly sales over the last 6 months?',
      },
    ];

    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should include todo about inability to do forecasts
  });

  it('should handle unusual correlation requests', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: "What's the influence of unicorn sightings on our sales?",
      },
    ];

    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should create todos about identifying both elements
  });

  it('should use conversation history for context', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'I need to analyze our product performance',
      },
      {
        role: 'assistant',
        content:
          'I can help you analyze product performance. What specific aspects would you like to explore?',
      },
      {
        role: 'user',
        content: 'Show me the top 10 products',
      },
    ];

    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
  });

  it('should handle follow-up questions with context', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'Show me sales for Red Bull',
      },
      {
        role: 'assistant',
        content: 'Here are the sales figures for Red Bull products...',
      },
      {
        role: 'user',
        content: 'What about last month specifically?',
      },
    ];

    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should leverage context from previous messages
  });

  it('should handle specific tracking number requests', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content:
          'I have a Fedex Smartpost tracking number and I need the USPS tracking number. Can you find that for me? Here is the fedex number: 286744112345',
      },
    ];

    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should create todos about data availability
  });

  it('should handle complex condition breakdowns', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'What is the best selling sports car?',
      },
    ];

    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should break down "sports car" and "best selling"
  });

  it('should handle channel-specific queries', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'How many smart TVs were sold online?',
      },
    ];

    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should include todos about smart TVs and online channel
  });

  it('should handle empty prompt gracefully', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: '',
      },
    ];

    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(result.todos).toBe(''); // Empty TODO list for empty prompt
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    expect(result.todosMessage.content).toBe('');
  });

  it('should handle very long complex prompts', async () => {
    const longPrompt = `
      I need a comprehensive analysis including:
      1. Revenue trends over the last 12 months by product category
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

    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: longPrompt,
      },
    ];

    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    expect(result.todos.length).toBeGreaterThan(0);
  });

  it('should handle requests with specific metrics', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'Calculate customer lifetime value segmented by acquisition channel',
      },
    ];

    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should include todos about CLV calculation and segmentation
  });

  it('should handle abort scenario gracefully', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'Show me quarterly revenue trends',
      },
    ];

    // Even if internally aborted, should return valid structure
    const result = await runCreateTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
  });

  it('should process concurrent todo creation requests', async () => {
    const promises = Array.from({ length: 3 }, (_, i) =>
      runCreateTodosStep({
        messages: [
          {
            role: 'user' as const,
            content: `Query ${i}: Show me sales data`,
          },
        ],
      })
    );

    const results = await Promise.all(promises);

    expect(results).toHaveLength(3);
    results.forEach((result) => {
      expect(result).toBeDefined();
      expect(result.todos).toBeDefined();
      expect(typeof result.todos).toBe('string');
    });
  });
});
