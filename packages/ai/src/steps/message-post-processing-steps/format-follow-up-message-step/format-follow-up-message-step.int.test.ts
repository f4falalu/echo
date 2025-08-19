import type { ModelMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import { runFormatFollowUpMessageStep } from './format-follow-up-message-step';

describe('format-follow-up-message-step integration', () => {
  it('should format follow-up message with new issues and assumptions', async () => {
    const mockConversationHistory: ModelMessage[] = [
      {
        content:
          'How many stock Mountain-500 series bikes were sold online to NA customers using a ColonialVoice card?',
        role: 'user',
      },
      {
        content: [
          {
            text: '<todo_list>\n        - Below are the items on your TODO list:\n        [ ] Determine how "Mountain-500 series bikes" are identified in the product data\n[ ] Determine how to filter for "stock" bikes versus other types\n[ ] Determine how "online" sales are identified versus other sales channels\n[ ] Determine how "NA customers" are identified in the customer data\n[ ] Determine how "ColonialVoice card" payment method is identified\n[ ] Determine the visualization type and axes for displaying the count\n        </todo_list>',
            type: 'text',
          },
        ],
        role: 'user',
      },
      {
        content: [
          {
            input: {
              final_response:
                "I found the answer to your specific question about Mountain-500 series bikes sold online to North American customers using ColonialVoice cards.\n\n**Result: 47 Mountain-500 series bikes were sold under these exact conditions.**\n\nHere's how I identified and filtered the data based on your requirements:\n\n- **Mountain-500 series bikes**: Found 10 different Mountain-500 variants in the database (5 black and 5 silver in various sizes: 40, 42, 44, 48, 52)\n- **Stock bikes**: Filtered for finished goods ready for sale (using the `finishedgoodsflag`)\n- **Online sales**: Used the online order flag to identify web-based purchases\n- **NA customers**: Included customers from United States, Canada, and Mexico\n- **ColonialVoice card**: Filtered specifically for this credit card type (which exists in the database alongside Vista, SuperiorCard, and Distinguish)\n\nThe analysis shows that despite the very specific filtering criteria, there was still a meaningful volume of 47 bikes sold through this particular channel combination. This suggests that ColonialVoice cardholders in North America represent an active customer segment for the Mountain-500 product line in online sales.",
            },
            toolCallId: 'toolu_06WAfvCoQtpBoNdmNi17LKCe',
            toolName: 'doneTool',
            type: 'tool-call',
          },
        ],
        role: 'assistant',
      },
      {
        content: [
          {
            output: { success: true } as any,
            toolCallId: 'toolu_06WAfvCoQtpBoNdmNi17LKCe',
            toolName: 'doneTool',
            type: 'tool-result',
          },
        ],
        role: 'tool',
      },
    ];

    // Mock combined input from parallel steps with follow-up context

    // Call the step execution function with proper parameters
    const result = await runFormatFollowUpMessageStep({
      userName: 'John',
      flaggedIssues: 'New issues detected with date range assumptions in follow-up query',
      majorAssumptions: [
        {
          descriptiveTitle: 'Date range assumption for monthly trends',
          explanation:
            'User requested monthly trends but did not specify date range, so assuming all available historical data',
          label: 'major',
        },
      ],
      conversationHistory: mockConversationHistory,
    });

    // Verify the step executed successfully and returned formatted message
    expect(result).toBeDefined();
    expect(result.summaryMessage).toBeDefined();
    expect(result.summaryTitle).toBeDefined();
    expect(typeof result.summaryMessage).toBe('string');
    expect(typeof result.summaryTitle).toBe('string');
  });
});
