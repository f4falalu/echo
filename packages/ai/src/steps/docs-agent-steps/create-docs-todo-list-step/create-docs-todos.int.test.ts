import type { ModelMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import { runCreateDocsTodosStep } from './create-docs-todos-step';

describe('create-docs-todos-step integration', () => {
  it('should create todos for basic documentation request', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'Can you update the documentation for the customers table?',
      },
    ];

    const result = await runCreateDocsTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    expect(result.todosMessage.content).toBe(result.todos);
    expect(result.todos).toContain('[ ]'); // Should contain checkbox format
  });

  it('should create todos for dbt model documentation request', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content:
          'I need to document all the dbt models in our project. Can you help create a comprehensive TODO list?',
      },
    ];

    const result = await runCreateDocsTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    expect(result.todos).toContain('[ ]');
    // Should contain documentation-specific content
    expect(result.todos).toMatch(/documentation|models|dbt/i);
  });

  it('should create todos with repository tree context', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'Review the repository structure and document the main models',
      },
    ];

    const repositoryTree = `
models/
├── customers.sql
├── orders.sql
├── products.sql
└── staging/
    ├── stg_customers.sql
    └── stg_orders.sql
docs/
├── customers.yml
└── orders.yml
`;

    const result = await runCreateDocsTodosStep({ messages, repositoryTree });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    expect(result.todos).toContain('[ ]');
  });

  it('should handle requests for specific field documentation', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content:
          'Can you update the docs to clarify that deal amount fields in customers table actually originate from HubSpot?',
      },
    ];

    const result = await runCreateDocsTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should contain relevant content about fields and updates
    expect(result.todos).toMatch(/customers|deal|amount|HubSpot/i);
  });

  it('should create todos for comprehensive dbt project documentation', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: `I need your help documenting our dbt project for the first time. Please create a comprehensive TODO list that covers:
        - Exploring the repository structure
        - Updating the overview file  
        - Identifying and verifying relationships
        - Classifying columns as Stored Value or ENUM
        - Generating table and column definitions
        - Creating pull requests`,
      },
    ];

    const result = await runCreateDocsTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    expect(result.todos).toContain('[ ]');
    // Should contain phased approach with multiple sections
    expect(result.todos).toMatch(/phase|repository|relationships|columns/i);
  });

  it('should handle requests for updating existing documentation', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content:
          'Can you update the documentation to reflect that a new customer should be defined as someone who made their first purchase during the current calendar year?',
      },
    ];

    const result = await runCreateDocsTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should contain relevant content about customer definition updates
    expect(result.todos).toMatch(/customer|definition|calendar year|purchase/i);
  });

  it('should use conversation history for context', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'I need to update our dbt project documentation',
      },
      {
        role: 'assistant',
        content:
          'I can help you update the dbt project documentation. What specific aspects would you like to focus on?',
      },
      {
        role: 'user',
        content: "Let's focus on the customer models first",
      },
    ];

    const result = await runCreateDocsTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should leverage context from previous messages about customer models
    expect(result.todos).toMatch(/customer|models/i);
  });

  it('should handle requests for specific file type updates', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content:
          'Update all the .yml files to include proper descriptions and add any missing relationships',
      },
    ];

    const result = await runCreateDocsTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should contain specific references to yml files and relationships
    expect(result.todos).toMatch(/\.yml|descriptions|relationships/i);
  });

  it('should create todos for data catalog setup', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content:
          'Help me set up a comprehensive data catalog for our dbt repository. We need to document all models, relationships, and create overview documentation.',
      },
    ];

    const result = await runCreateDocsTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should contain catalog-specific content
    expect(result.todos).toMatch(/catalog|models|relationships|overview/i);
  });

  it('should handle requests for relationship documentation', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content:
          'Review and document all the relationships between our dbt models, including primary and foreign keys',
      },
    ];

    const result = await runCreateDocsTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should contain relationship-specific content
    expect(result.todos).toMatch(/relationships|primary.*key|foreign.*key|models/i);
  });

  it('should handle minimal message gracefully', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'help',
      },
    ];

    const result = await runCreateDocsTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    expect(result.todosMessage.content).toBe(result.todos);
  });

  it('should handle complex multi-phase documentation requests', async () => {
    const longRequest = `
      I need a comprehensive dbt documentation update including:
      1. Review all model definitions and add missing descriptions
      2. Document all column relationships and foreign keys
      3. Create overview documentation for each data mart
      4. Add Stored Value and ENUM classifications
      5. Verify all joins and relationships are documented
      6. Create needs_clarification.md for ambiguous items
      7. Set up proper .yml structure for all models
      8. Generate pull request with all changes
    `.trim();

    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: longRequest,
      },
    ];

    const result = await runCreateDocsTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    expect(result.todos.length).toBeGreaterThan(0);
    expect(result.todos).toContain('[ ]');
    // Should contain multiple phases and comprehensive content
    expect(result.todos).toMatch(/phase|models|relationships|pull request/i);
  });

  it('should handle requests for metadata integration', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content:
          'Use the metadata from .json files to enhance our model documentation and identify any missing relationships',
      },
    ];

    const result = await runCreateDocsTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should contain metadata and json file references
    expect(result.todos).toMatch(/metadata|\.json|relationships/i);
  });

  it('should handle follow-up requests with context', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'Document the customers model',
      },
      {
        role: 'assistant',
        content: 'I can help document the customers model. Let me create a TODO list for that.',
      },
      {
        role: 'user',
        content: 'Actually, also include the orders model and their relationships',
      },
    ];

    const result = await runCreateDocsTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should leverage context from previous messages about both models
    expect(result.todos).toMatch(/customers|orders|relationships/i);
  });

  it('should handle requests for specific business context documentation', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content:
          'Add business context to our product models explaining how they relate to our e-commerce platform and customer journey',
      },
    ];

    const result = await runCreateDocsTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should contain business context specific content
    expect(result.todos).toMatch(/business.*context|product|e-commerce|customer.*journey/i);
  });

  it('should process concurrent todo creation requests', async () => {
    const promises = Array.from({ length: 3 }, (_, i) =>
      runCreateDocsTodosStep({
        messages: [
          {
            role: 'user' as const,
            content: `Request ${i}: Document the sales_model_${i} and its relationships`,
          },
        ],
      })
    );

    const results = await Promise.all(promises);

    expect(results).toHaveLength(3);
    results.forEach((result, index) => {
      expect(result).toBeDefined();
      expect(result.todos).toBeDefined();
      expect(typeof result.todos).toBe('string');
      expect(result.todosMessage).toBeDefined();
      expect(result.todosMessage.role).toBe('assistant');
    });
  });

  it('should handle vague documentation requests appropriately', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'Make the documentation better',
      },
    ];

    const result = await runCreateDocsTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should create todos about determining what needs improvement
    expect(result.todos.length).toBeGreaterThan(0);
  });

  it('should include pull request creation in todos', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content:
          'Document the key customer and order models with proper descriptions and relationships',
      },
    ];

    const result = await runCreateDocsTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should include pull request creation
    expect(result.todos).toMatch(/pull request|create.*pr|git.*push/i);
  });

  it('should handle repository tree with complex structure', async () => {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'Create comprehensive documentation for all models in this repository',
      },
    ];

    const complexRepositoryTree = `
models/
├── marts/
│   ├── core/
│   │   ├── dim_customers.sql
│   │   ├── dim_products.sql
│   │   └── fct_orders.sql
│   └── finance/
│       ├── fct_revenue.sql
│       └── dim_accounts.sql
├── intermediate/
│   ├── int_customer_metrics.sql
│   └── int_order_items.sql
└── staging/
    ├── stg_shopify_customers.sql
    ├── stg_shopify_orders.sql
    └── stg_hubspot_deals.sql
docs/
├── models/
│   ├── core.yml
│   ├── finance.yml
│   └── staging.yml
└── overview.md
`;

    const result = await runCreateDocsTodosStep({
      messages,
      repositoryTree: complexRepositoryTree,
    });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    expect(result.todos).toContain('[ ]');
    // Should handle the complex structure appropriately
    expect(result.todos.length).toBeGreaterThan(0);
  });

  it('should handle unusual characters in content', async () => {
    // Test with special characters that might cause issues
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: 'Document models with special chars: émojis 🚀 and symbols @#$%',
      },
    ];

    const result = await runCreateDocsTodosStep({ messages });

    expect(result).toBeDefined();
    expect(result.todos).toBeDefined();
    expect(typeof result.todos).toBe('string');
    expect(result.todosMessage).toBeDefined();
    expect(result.todosMessage.role).toBe('assistant');
    // Should handle gracefully
    expect(result.todos).toMatch(/models|document/i);
  });
});
