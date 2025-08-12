import type { CoreMessage } from 'ai';

// Define the required template parameters
interface AnalysisTypeRouterTemplateParams {
  userPrompt: string;
  conversationHistory?: CoreMessage[];
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

Standard mode is the default. Use it for common questions, building charts/dashboards, narrative reports with minor analysis, single metrics, specific reports, or when the query isn't a deep research question. It handles lightweight tasks and some analysis, but not iterative deep dives.

Investigation mode is for deep research on open-ended or vague research questions, like understanding phenomena, determining causes, or questions requiring iterative thinking, asking follow-up questions internally, and digging deeper. It's more expensive and time-consuming, so only use it when truly necessary — always prefer Standard unless the query explicitly demands extensive, iterative investigation.

Decision principle: choose the mode based on the cognitive effort required, not on business domain or topic complexity.

Rule of thumb:
- If a single-pass plan of <= 3 deterministic steps (without needing to ask yourself clarifying questions) will likely answer it, choose Standard.
- If it requires hypothesis generation, clarifying questions, exploring multiple plausible explanations, or iterative analysis over data, choose Investigation.

Choose Investigation only when one or more of these triggers are present:
- The query is ambiguous/vague and must be disambiguated to proceed
- Answering requires generating and testing hypotheses against data
- Multiple iterations over data or multi-hop reasoning are unavoidable
- New assumptions must be explicitly stated and evaluated
- The user explicitly requests deep research/investigation

Choose Standard when any of these are true:
- Retrieve or compute a single metric or a simple aggregation/filters
- Build a straightforward chart/table or a routine dashboard element
- Summarize or lightly describe provided results without exploring unknowns
- The plan is short, deterministic, and unlikely to spawn internal follow-up questions

Guidance:
- Do not choose Investigation just because the topic involves business KPIs; if the request is a simple lookup or breakdown, choose Standard.
- For follow-ups within an investigative conversation, decide per this turn: if the request is a small deterministic lookup, choose Standard.

User query: ${userPrompt}${historySection}

Analyze the query${hasHistory ? ' in the context of the history' : ''} and decide the mode.

Respond only with JSON:
{
  "choice": "standard" or "investigation",
  "reasoning": "1-2 sentences referencing the checklist above"
}`;
}
