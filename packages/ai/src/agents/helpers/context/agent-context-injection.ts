/**
 * Creates a context injection function for any agent prepareStep.
 * This function returns the agent options as context that can be accessed by tools.
 */
export function injectAgentContext<T>(agentOptions: T) {
  return async () => {
    return {
      context: agentOptions,
    };
  };
}
