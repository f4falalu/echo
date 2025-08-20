import type { PlateEditor } from 'platejs/react';
import type { Value, Element, Text } from 'platejs';

import { type PluginConfig, KEYS } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

export interface StreamChunkOptions {
  // No options needed - always uses simple logic
}

export interface StreamChunk {
  /** Unique identifier for the content chunk */
  id: string;
  /** The content to stream */
  content: Value;
  /** Type of content (e.g., 'paragraph', 'heading', 'code') */
  type?: string;
}

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
    streamChunk: (chunk: StreamChunk) => {
      const editor = ctx.editor as PlateEditor;
      const previousChunkId = ctx.getOption('previousChunkId') as string | null;

      if (previousChunkId === chunk.id) {
        // Replace the last node with new content
        replaceLastNode(editor, chunk.content);
      } else {
        // Append new chunk to the end
        insertContentAtEndWithId(editor, chunk.content, chunk.id);
      }

      // Update the previous chunk ID
      ctx.setOption('previousChunkId', chunk.id);
    },

    /**
     * Stream complete array of chunks with efficient length-based updates
     */
    streamFull: (chunks: StreamChunk[]) => {
      const editor = ctx.editor as PlateEditor;

      if (!chunks || chunks.length === 0) {
        console.warn('streamFull: No chunks provided');
        return;
      }

      const currentLength = editor.children.length;
      const incomingLength = chunks.length;

      console.log('=== STREAM FULL DEBUG ===');
      console.log('Current editor length:', currentLength);
      console.log('Incoming chunks length:', incomingLength);
      console.log('Incoming chunks:', chunks);

      if (currentLength === incomingLength) {
        // Same length: update the last node only
        console.log('🔄 Same length - updating last node');
        const lastChunk = chunks[chunks.length - 1];
        replaceLastNode(editor, lastChunk.content);
      } else if (incomingLength > currentLength) {
        // Incoming longer: update last node + append new nodes
        console.log('➕ Incoming longer - updating last + appending new');

        // First, update the last existing node
        if (currentLength > 0) {
          const lastChunk = chunks[currentLength - 1];
          replaceLastNode(editor, lastChunk.content);
        }

        // Then append any additional chunks
        const additionalChunks = chunks.slice(currentLength);
        for (const chunk of additionalChunks) {
          insertContentAtEndWithId(editor, chunk.content, chunk.id);
        }
      } else {
        // Incoming shorter: truncate and update
        console.log('➖ Incoming shorter - truncating and updating');

        // Remove excess nodes
        const nodesToRemove = currentLength - incomingLength;
        for (let i = 0; i < nodesToRemove; i++) {
          const lastPoint = editor.api.end([]);
          const lastPath = lastPoint?.path;
          if (lastPath && Array.isArray(lastPath) && lastPath.length > 0) {
            const pathToRemove = [...lastPath];
            pathToRemove[pathToRemove.length - 1] -= 1;
            if (pathToRemove[pathToRemove.length - 1] >= 0) {
              editor.tf.removeNodes({ at: pathToRemove });
            }
          }
        }

        // Update the last remaining node
        if (incomingLength > 0) {
          const lastChunk = chunks[incomingLength - 1];
          replaceLastNode(editor, lastChunk.content);
        }
      }

      console.log('Editor children after streamFull:', JSON.stringify(editor.children, null, 2));
      console.log('=== END STREAM FULL DEBUG ===');
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
const insertContentAtEndWithId = (editor: PlateEditor, content: Value, id: string) => {
  if (!content || content.length === 0) return;

  // Add ID to the content nodes
  const contentWithId = addIdToContent(content, id);

  // Get the last path in the document
  const lastPath = editor.api.end([]);

  // Insert content at the end
  editor.tf.insertNodes(contentWithId, {
    at: lastPath,
    select: false
  });

  // Move cursor to the end of the inserted content
  const newEndPath = editor.api.end([]);
  editor.tf.select(newEndPath);
};

/**
 * Add ID to content nodes
 */
const addIdToContent = (content: Value, id: string): Value => {
  const result = content.map((node) => ({
    ...node,
    id: id
  }));
  return result;
};

/**
 * Replace the last node in the document with new content
 */
const replaceLastNode = (editor: PlateEditor, newContent: Value) => {
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

  // Insert the new content at the end
  if (lastPath && Array.isArray(lastPath)) {
    editor.tf.insertNodes(newContent, {
      at: lastPath,
      select: false
    });
  }
};

/**
 * Generate a unique chunk ID
 */
const generateChunkId = (): string => {
  return `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Utility function to create a stream chunk with ID
 */
export const createStreamChunk = (
  id: string,
  content: Value,
  type: string = 'paragraph'
): StreamChunk => {
  return {
    id,
    content,
    type
  };
};

/**
 * Utility function to create a paragraph chunk
 */
export const createParagraphChunk = (id: string, text: string): StreamChunk => {
  return createStreamChunk(id, [{ type: 'p', children: [{ text }] }], 'paragraph');
};

/**
 * Utility function to create a heading chunk
 */
export const createHeadingChunk = (id: string, text: string, level: 1 | 2 | 3 = 1): StreamChunk => {
  return createStreamChunk(id, [{ type: `h${level}`, children: [{ text }] }], 'heading');
};
