import type { PlateEditor } from 'platejs/react';
import type { Element, Text } from 'platejs';
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
     * Stream complete array of chunks with efficient length-based updates
     */
    streamFull: (chunks: ReportElementWithId[]) => {
      const editor = ctx.editor as PlateEditor;

      if (!chunks || chunks.length === 0) {
        return;
      }

      // Prevent undo/redo and defer normalization for performance
      editor.tf.withScrolling(() => {
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
                    // Insert the chunk as a properly formatted node
                    const nodeToInsert = {
                      ...chunk,
                      id: chunk.id // Ensure ID is preserved
                    };
                    editor.tf.insertNodes(nodeToInsert, { at: [i], select: false });
                  });
                } else {
                  // Same ID, check if content changed (only if necessary)
                  const existingText = extractTextFromNode(existingNode);
                  const incomingText = extractTextFromChildren(chunk.children);

                  if (existingText !== incomingText) {
                    operations.push(() => {
                      // Remove the old node and insert the new one
                      editor.tf.removeNodes({ at: [i] });
                      // Insert the chunk as a properly formatted node
                      const nodeToInsert = {
                        ...chunk,
                        id: chunk.id // Ensure ID is preserved
                      };
                      editor.tf.insertNodes(nodeToInsert, { at: [i], select: false });
                    });
                  }
                }
              } else {
                // New node to append
                operations.push(() => {
                  // Insert the chunk as a properly formatted node
                  const nodeToInsert = {
                    ...chunk,
                    id: chunk.id // Ensure ID is preserved
                  };
                  editor.tf.insertNodes(nodeToInsert, {
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
 * Extract text content from children array (optimized for performance)
 */
const extractTextFromChildren = (children: ReportElementWithId['children']): string => {
  // Use string concatenation instead of map/join for better performance
  let result = '';
  for (const node of children) {
    result += extractTextFromNode(node as Element | Text);
  }
  return result;
};
