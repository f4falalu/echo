import type { PlateEditor } from 'platejs/react';
import type { Value, Element, Text } from 'platejs';
import { createPlatePlugin } from 'platejs/react';
import type { ReportElementWithId } from '@buster/server-shared/reports';

export const StreamContentPlugin = createPlatePlugin({
  key: 'streamContent',
  options: {
    isStreaming: false,
    previousChunkId: null as string | null
  }
}).extendEditorApi((ctx) => ({
  streamContent: {
    /**
     * Start streaming mode
     */
    start: () => {
      ctx.setOption('isStreaming', true);
      ctx.setOption('previousChunkId', null);
    },

    /**
     * Stop streaming mode
     */
    stop: () => {
      ctx.setOption('isStreaming', false);
      ctx.setOption('previousChunkId', null);
    },

    /**
     * Check if currently streaming
     */
    isStreaming: () => {
      return ctx.getOption('isStreaming') as boolean;
    },

    /**
     * Stream a single chunk with intelligent replacement logic
     */
    streamChunk: (chunk: ReportElementWithId, options?: { moveCursor?: boolean }) => {
      const editor = ctx.editor as PlateEditor;
      const previousChunkId = ctx.getOption('previousChunkId') as string | null;
      const moveCursor = options?.moveCursor ?? false;

      // Prevent undo/redo for streaming operations
      editor.tf.withoutSaving(() => {
        if (previousChunkId === chunk.id) {
          // Replace the last node with new content
          replaceLastNode(editor, chunk.children);
        } else {
          // Append new chunk to the end
          insertContentAtEnd(editor, chunk, moveCursor);
        }
      });

      // Update the previous chunk ID
      ctx.setOption('previousChunkId', chunk.id);
    },

    /**
     * Stream complete array of chunks with efficient length-based updates
     */
    streamFull: (chunks: ReportElementWithId[], options?: { debug?: boolean }) => {
      const editor = ctx.editor as PlateEditor;
      const debug = options?.debug ?? false;

      if (!chunks || chunks.length === 0) {
        if (debug) console.warn('streamFull: No chunks provided');
        return;
      }

      // Prevent undo/redo and defer normalization for performance
      editor.tf.withoutSaving(() => {
        editor.tf.withoutNormalizing(() => {
          // Get all current nodes in the editor
          const currentNodes = editor.children;
          const currentLength = currentNodes.length;
          const incomingLength = chunks.length;

          // Batch operations for better performance
          const operations: Array<() => void> = [];

          // First, identify all operations we need to perform
          for (let i = 0; i < incomingLength; i++) {
            const chunk = chunks[i];

            if (i < currentLength) {
              const existingNode = currentNodes[i];

              // Quick ID check first (fast)
              if (existingNode.id !== chunk.id) {
                // Different ID, needs replacement
                operations.push(() => {
                  // Remove the old node and insert the new one
                  editor.tf.removeNodes({ at: [i] });
                  editor.tf.insertNodes(chunk, { at: [i], select: false });
                });
              } else {
                // Same ID, check if content changed (only if necessary)
                const existingText = extractTextFromNode(existingNode);
                const incomingText = extractTextFromValue(chunk.children);

                if (existingText !== incomingText) {
                  operations.push(() => {
                    // Remove the old node and insert the new one
                    editor.tf.removeNodes({ at: [i] });
                    editor.tf.insertNodes(chunk, { at: [i], select: false });
                  });
                }
              }
            } else {
              // New node to append
              operations.push(() => {
                editor.tf.insertNodes(chunks, {
                  at: [editor.children.length],
                  select: false
                });
              });
            }
          }

          // Handle removals if incoming is shorter
          if (currentLength > incomingLength) {
            operations.push(() => {
              // Remove extra nodes one by one (Slate doesn't support batch removal with array of paths)
              for (let i = currentLength - 1; i >= incomingLength; i--) {
                editor.tf.removeNodes({ at: [i] });
              }
            });
          }

          // Execute all operations
          operations.forEach((op) => op());
        });
      });
    },

    /**
     * Find a node with a specific ID
     */
    findNodeWithId: (id: string) => {
      const editor = ctx.editor as PlateEditor;
      return findNodeWithId(editor, id);
    }
  }
}));

/**
 * Find a node with a specific ID in the editor (only checks the last node)
 */
const findNodeWithId = (editor: PlateEditor, id: string): number[] | null => {
  // Only check the last node since we always append to the end
  const lastIndex = editor.children.length - 1;
  if (lastIndex >= 0) {
    const lastNode = editor.children[lastIndex];

    if (lastNode.id === id) {
      return [lastIndex];
    }
  }

  return null;
};

/**
 * Insert content at the end of the document with ID
 */
const insertContentAtEnd = (
  editor: PlateEditor,
  content: ReportElementWithId,
  moveCursor = true
) => {
  const children = content.children;
  if (!content || children.length === 0) return;

  // Add ID to the content nodes

  // Get the last path in the document
  const lastPath = editor.api.end([]);

  // Insert content at the end
  editor.tf.insertNodes(content, {
    at: lastPath,
    select: false
  });

  // Only move cursor if requested (for performance during streaming)
  if (moveCursor) {
    const newEndPath = editor.api.end([]);
    editor.tf.select(newEndPath);
  }
};

/**
 * Replace the last node in the document with new content
 */
const replaceLastNode = (editor: PlateEditor, newContent: ReportElementWithId['children']) => {
  if (!newContent || newContent.length === 0) {
    return;
  }

  // Get the last path in the document
  const lastPoint = editor.api.end([]);

  // Extract the path from the point
  const lastPath = lastPoint?.path;

  // Remove the last node
  if (lastPath && Array.isArray(lastPath) && lastPath.length > 0) {
    const pathToRemove = [...lastPath];
    pathToRemove[pathToRemove.length - 1] -= 1; // Go back one node

    if (pathToRemove[pathToRemove.length - 1] >= 0) {
      editor.tf.removeNodes({ at: pathToRemove });
    }
  }

  // Insert the new content at the end (not at the last path, but at the end)
  const endPoint = editor.api.end([]);
  const endPath = endPoint?.path;
  if (endPath && Array.isArray(endPath)) {
    editor.tf.insertNodes(newContent as Value, {
      at: endPath,
      select: false
    });
  }
};

/**
 * Extract text content from a node (optimized for performance)
 */
const extractTextFromNode = (node: Element | Text): string => {
  if ('text' in node) {
    return typeof node.text === 'string' ? node.text : '';
  }
  if ('children' in node && Array.isArray(node.children)) {
    // Use string concatenation instead of join for better performance
    let result = '';
    for (const child of node.children) {
      result += extractTextFromNode(child as Element | Text);
    }
    return result;
  }
  return '';
};

/**
 * Extract text content from a Value (optimized for performance)
 */
const extractTextFromValue = (value: ReportElementWithId['children']): string => {
  // Use string concatenation instead of map/join for better performance
  let result = '';
  for (const node of value) {
    result += extractTextFromNode(node as Element | Text);
  }
  return result;
};
