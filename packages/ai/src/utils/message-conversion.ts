import type { ModelMessage } from 'ai';

/**
 * Converts AI SDK v4 CoreMessage to v5 ModelMessage
 * 
 * Key differences:
 * - ImagePart: mimeType → mediaType
 * - FilePart: mimeType → mediaType, added optional filename
 * - ToolResultPart: result → output (with structured type)
 * - ToolCallPart: remains the same (args field)
 */
export function convertCoreMessageToModelMessage(message: any): ModelMessage {
  // Handle null/undefined
  if (!message || typeof message !== 'object' || !message.role) {
    return message as ModelMessage;
  }

  const { role, content } = message;

  switch (role) {
    case 'system':
      // System messages remain string-based
      return {
        role: 'system',
        content: typeof content === 'string' ? content : '',
      };

    case 'user':
      // User messages can be string or array of parts
      if (typeof content === 'string') {
        return {
          role: 'user',
          content,
        };
      }
      
      if (Array.isArray(content)) {
        return {
          role: 'user',
          content: content.map(convertContentPart),
        };
      }
      
      return { role: 'user', content: '' };

    case 'assistant':
      // Assistant messages can be string or array of parts
      if (typeof content === 'string') {
        return {
          role: 'assistant',
          content,
        };
      }
      
      if (Array.isArray(content)) {
        return {
          role: 'assistant',
          content: content.map(convertContentPart),
        };
      }
      
      return { role: 'assistant', content: '' };

    case 'tool':
      // Tool messages are always arrays of ToolResultPart
      if (Array.isArray(content)) {
        return {
          role: 'tool',
          content: content.map(convertToolResultPart),
        };
      }
      
      return { role: 'tool', content: [] };

    default:
      // Pass through unknown roles
      return message as ModelMessage;
  }
}

/**
 * Convert content parts from v4 to v5 format
 */
function convertContentPart(part: any): any {
  if (!part || typeof part !== 'object' || !part.type) {
    return part;
  }

  switch (part.type) {
    case 'text':
      // Text parts remain the same
      return part;

    case 'image':
      // Convert mimeType → mediaType
      if ('mimeType' in part) {
        const { mimeType, ...rest } = part;
        return {
          ...rest,
          mediaType: mimeType,
        };
      }
      return part;

    case 'file':
      // Convert mimeType → mediaType
      if ('mimeType' in part) {
        const { mimeType, ...rest } = part;
        return {
          ...rest,
          mediaType: mimeType,
        };
      }
      return part;

    case 'tool-call':
      // Tool calls remain the same (args field stays)
      return part;

    default:
      return part;
  }
}

/**
 * Convert tool result parts from v4 to v5 format
 */
function convertToolResultPart(part: any): any {
  if (!part || typeof part !== 'object' || part.type !== 'tool-result') {
    return part;
  }

  // Convert result → output with proper structure
  if ('result' in part && !('output' in part)) {
    const { result, experimental_content, isError, ...rest } = part;
    
    // Convert result to structured output format
    let output;
    if (isError) {
      // Error results
      if (typeof result === 'string') {
        output = { type: 'error-text', value: result };
      } else {
        output = { type: 'error-json', value: result };
      }
    } else {
      // Success results
      if (typeof result === 'string') {
        output = { type: 'text', value: result };
      } else {
        output = { type: 'json', value: result };
      }
    }
    
    return {
      ...rest,
      output,
    };
  }
  
  return part;
}

/**
 * Converts an array of v4 CoreMessages to v5 ModelMessages
 */
export function convertCoreMessagesToModelMessages(messages: any[]): ModelMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }
  return messages.map(convertCoreMessageToModelMessage);
}

/**
 * Helper to check if content is already in v5 format
 * Useful when migrating codebases that might have mixed formats
 */
export function isV5ContentFormat(content: any): boolean {
  // Check for tool result with v5 output field
  if (Array.isArray(content) && content.length > 0) {
    const firstItem = content[0];
    if (firstItem?.type === 'tool-result' && 'output' in firstItem) {
      return true;
    }
  }
  return false;
}

/**
 * Smart conversion that handles both v4 and v5 formats
 * Useful during migration when you might have mixed message formats
 */
export function ensureModelMessageFormat(message: any): ModelMessage {
  // Already in v5 format if tool messages have 'output' field
  if (message?.role === 'tool' && isV5ContentFormat(message.content)) {
    return message as ModelMessage;
  }
  
  // Convert from v4 format
  return convertCoreMessageToModelMessage(message);
}