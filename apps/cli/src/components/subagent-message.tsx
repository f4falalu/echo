import { Box, Text } from 'ink';
import { UI_CONSTANTS } from '../constants/ui';
import { useExpansion } from '../hooks/use-expansion';
import type { AgentMessage } from '../types/agent-messages';
import { ToolBadge } from './shared/tool-badge';
import { StatusLine } from './shared/status-line';
import { IndentedContent } from './shared/indented-content';
import { ExpansionHint } from './shared/expansion-hint';

interface SubagentMessageProps {
  message: Extract<AgentMessage, { kind: 'subagent' }>;
}

/**
 * Component for displaying subagent delegated task execution
 * Shows SUBAGENT badge, instructions, and nested messages from subagent
 * Supports expansion with Ctrl+O to show all subagent messages
 */
export function SubagentMessage({ message }: SubagentMessageProps) {
  const [isExpanded] = useExpansion();
  const { args, result } = message;

  if (!result) {
    return null;
  }

  // Handle error case
  if (result.status === 'error') {
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Box flexDirection="row">
          <Text bold color="white" backgroundColor={UI_CONSTANTS.TOOL_COLORS.EXECUTE}>
            SUBAGENT
          </Text>
        </Box>
        <StatusLine message={`Error: ${result.error_message}`} status="error" />
      </Box>
    );
  }

  // Count tool calls for summary
  const toolCallCount = result.messages?.length || 0;
  const hasMessages = toolCallCount > 0;

  // Truncate instructions for display
  const instructionsPreview =
    args.instructions.length > 80
      ? args.instructions.substring(0, 80) + '...'
      : args.instructions;

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* SUBAGENT badge with instructions preview */}
      <Box flexDirection="row">
        <Text bold color="white" backgroundColor={UI_CONSTANTS.TOOL_COLORS.EXECUTE}>
          SUBAGENT
        </Text>
        <Text color={UI_CONSTANTS.COLORS.TEXT_SECONDARY}> ({instructionsPreview})</Text>
      </Box>

      {/* Show nested messages when expanded */}
      {isExpanded && hasMessages && (
        <IndentedContent>
          <Box flexDirection="column">
            <Text color={UI_CONSTANTS.COLORS.TEXT_DIM} dimColor>
              ── Subagent Messages ──
            </Text>
            {result.messages?.map((msg, idx) => (
              <Box key={idx} flexDirection="column" marginTop={idx > 0 ? 1 : 0}>
                <Text color={UI_CONSTANTS.COLORS.TEXT_PRIMARY}>
                  {msg.tool} ({msg.event})
                </Text>
                {msg.result && (
                  <Text color={UI_CONSTANTS.COLORS.TEXT_DIM}>
                    {JSON.stringify(msg.result, null, 2)}
                  </Text>
                )}
              </Box>
            ))}
            <Text color={UI_CONSTANTS.COLORS.TEXT_DIM} dimColor marginTop={1}>
              ── End Subagent Messages ──
            </Text>
          </Box>
        </IndentedContent>
      )}

      {/* Expansion hint if there are messages */}
      {hasMessages && !isExpanded && (
        <Box paddingLeft={UI_CONSTANTS.PADDING.INDENT}>
          <Text color={UI_CONSTANTS.COLORS.TEXT_DIM} dimColor>
            Press Ctrl+O to view {toolCallCount} subagent message
            {toolCallCount !== 1 ? 's' : ''}
          </Text>
        </Box>
      )}
      {hasMessages && isExpanded && (
        <Box paddingLeft={UI_CONSTANTS.PADDING.INDENT}>
          <Text color={UI_CONSTANTS.COLORS.TEXT_DIM} dimColor>
            (Press Ctrl+O to collapse)
          </Text>
        </Box>
      )}

      {/* Status line with summary */}
      <StatusLine
        message={
          result.summary ||
          `Completed with ${toolCallCount} tool call${toolCallCount !== 1 ? 's' : ''}`
        }
        status="success"
      />
    </Box>
  );
}
