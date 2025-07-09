import type { CoreMessage } from 'ai';

export interface RetryableError {
  type:
    | 'no-such-tool'
    | 'invalid-tool-arguments'
    | 'empty-response'
    | 'rate-limit'
    | 'server-error'
    | 'network-timeout'
    | 'stream-interruption'
    | 'json-parse-error'
    | 'content-policy'
    | 'unknown-error';
  originalError?: Error | unknown;
  healingMessage: CoreMessage;
}

/**
 * Context for creating workflow-aware healing messages
 */
export interface WorkflowContext {
  currentStep: 'think-and-prep' | 'analyst';
  availableTools?: Set<string>;
}
