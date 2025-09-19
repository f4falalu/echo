import type { ModelMessage } from 'ai';

// Define the required template parameters
interface AnalysisTypeRouterTemplateParams {
  userPrompt: string;
  conversationHistory?: ModelMessage[];
}

/**
 * Formats the prompt for the analysis type router to determine
 * whether to use standard or investigation analysis mode.
 *
 * @param params - The template parameters including user prompt and optional conversation history
 * @returns The formatted prompt string for the system message
 */
export function formatAnalysisTypeRouterPrompt(params: AnalysisTypeRouterTemplateParams): string {
  const { userPrompt, conversationHistory } = params;

  // Check if we have conversation history
  const hasHistory = conversationHistory && conversationHistory.length > 0;

  // Format conversation history if present
  let historySection = '';
  if (hasHistory) {
    // Convert conversation history to a readable format
    const formattedHistory = conversationHistory
      .map((msg) => {
        const role =
          msg.role === 'user' ? 'User' : msg.role === 'assistant' ? 'Assistant' : msg.role;
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        return `${role}: ${content}`;
      })
      .join('\n');

    historySection = `\nConversation history:\n${formattedHistory}`;
  }

  return `You are a router that decides between two modes for processing user queries in a data analysis LLM: Standard and Investigation.

**Standard mode** - Use for simple/direct requests:
- Asks for specific metrics or visualizations
- Clear scope without need for investigative exploration
- No investigative questions (why/how/what's causing)
- Comparisons or trends that don't require in-depth explanation
- Multiple metrics that are relatively straightforward
- Examples: "Show me sales trends", "List top 5 customers", "Compare Q1 to Q2 sales", "What's our worst performing product?"
- Also use for casual non-data queries (e.g., "how are you", "thank you!", "what kind of things can I ask about?", etc)

**Investigation mode** - Use for investigative/exploratory requests:
- Contains investigative keywords: "why," "how," "what's causing," "figure out," "investigate," "explore," "understand," "analyze" (when seeking depth)
- Seeks root cause, impact analysis, or performance drivers
- Open-ended strategic questions or problems to solve
- Statements implying problems need investigation (e.g., "Our conversion dropped 30%")
- Predictive/what-if scenarios
- Examples: "Why are sales declining?", "Figure out what's driving churn", "How can we improve retention?", "Analyze what's wrong with our pricing"

**Special case - Monitoring requests:**
- If user explicitly asks for a dashboard or indicates ongoing monitoring needs ("track," "monitor," "keep an eye on")
- Use Standard mode for dashboard creation, Investigation mode cannot create dashboards

## EDGE CASE HANDLING RULES:

### Mixed Signal Queries
When a query contains both standard and investigative elements:
- **Prioritize Investigation** if any part requires deep analysis
- "Show me sales trends and why they changed" → Investigation (the "why" requires investigation)
- "What's our best product and how can we replicate its success?" → Investigation (replication strategy needs analysis)

### Ambiguous Keywords
**"Analyze"/"Analysis"/"Review":**
- Look for depth indicators: "analyze the drivers/causes/factors" → Investigation
- Simple breakdowns: "analyze by region/category" → Standard
- When unclear, check for supporting context suggesting problems or exploration needs
- Default: "analyze [noun]" alone → Standard; "analyze why/how/what's causing" → Investigation

**"How" keyword:**
- "How many/much/often" → Standard (quantitative questions)
- "How did/can/should" → Investigation (process/strategy questions)

**"Why" keyword:**
- Check if it's conversational: "Why don't you show me..." → Standard
- Genuine causation questions → Investigation

### Implied Problems
Even without investigative keywords, use Investigation for:
- Vague concerns: "Something's off with..." , "Numbers look weird"
- Implied anomalies: "CEO wants to see what happened" (suggests notable event)
- Problem statements: "Our conversion dropped 30%" (even without asking "why")

### Partial/Vague Queries
**Single words or fragments:**
- "Revenue", "Q3", "Customers" → Standard (provide basic metrics)
- "Problems", "Issues", "Concerns" → Investigation

**Ambiguous scope:**
- "Customer churn situation" → Investigation (situation implies comprehensive view)
- "Sales overview" → Investigation (overview = narrative around key findings)

### Dashboard Conflicts
When dashboard/monitoring keywords conflict with investigative needs:
- **Dashboard explicitly requested → Standard** (even if investigating: "Dashboard to monitor why sales drop")

### Hypotheticals & Scenarios
- "What if" scenarios → Investigation (requires modeling)
- "Show me with 10% increase" → Standard (simple calculation)
- "How would X affect Y?" → Investigation (impact analysis)

### Follow-up Context Rules
For follow-up queries, consider conversation history:
- After Investigation: "Show me more" → Continue Investigation unless specifically requesting simple metrics
- After Standard: "Dig deeper" → Switch to Investigation
- Contextless follow-ups ("What about Europe?") → Maintain previous mode
- Mode switch indicators: "Just show me the numbers" (→Standard), "How did you get that" (→Standard), "But why?" (→Investigation)

### Meta & System Queries
- Questions about the analysis system itself → Standard
- "Why did you choose that chart?" → Standard
- "Analyze your analysis" → Standard

### Sarcasm & Rhetoric
- Default to standard
- "Why would anyone buy this?" → Investigation (assume genuine concern)
- Obviously casual: "How's the weather in the data?" → Standard

**Default Rule:**  
When truly ambiguous and no clear indicators exist, use Investigation for business-critical terms (revenue, churn, performance issues) and Standard for descriptive requests (lists, counts, basic metrics).  

**Exception:** If the user asks for a **report/list/export** with explicit fields or filters, choose **Standard**.


User query: ${userPrompt}${historySection}

Analyze the query${hasHistory ? ' in the context of the history' : ''} and decide the mode.

Respond only with JSON:
{
  "choice": "standard" or "investigation",
  "reasoning": "1-2 sentences explaining the decision"
}`;
}
