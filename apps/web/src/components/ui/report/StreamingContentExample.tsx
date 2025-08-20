import React, { useCallback, useState } from 'react';
import type { Value } from 'platejs';

import { Plate, PlateContent } from 'platejs/react';
import { createPlateEditor } from 'platejs/react';

// Minimal required plugins for a working editor
import { BasicBlocksPlugin } from '@platejs/basic-nodes/react';
import { BoldPlugin, ItalicPlugin } from '@platejs/basic-nodes/react';

import { StreamContentPlugin, type StreamChunk } from './plugins/stream-content-plugin';

// Create an editor with minimal but functional plugins
const editor = createPlateEditor({
  plugins: [
    // Basic blocks (paragraphs, headings)
    BasicBlocksPlugin,
    // Text formatting
    BoldPlugin,
    ItalicPlugin,
    // Our streaming plugin
    StreamContentPlugin
  ],
  // Initial editor value
  value: [
    {
      type: 'p',
      children: [{ text: 'Start typing or use the streaming buttons below...' }]
    }
  ]
});

export function StreamingContentExample() {
  const [isStreaming, setIsStreaming] = useState(false);

  // Get the streaming plugin context
  const getStreamingPlugin = () => editor.getPlugin(StreamContentPlugin);

  // Start streaming content
  const handleStartStreaming = useCallback(() => {
    getStreamingPlugin().api.streamContent.start();
    setIsStreaming(true);
  }, []);

  // Stop streaming content
  const handleStopStreaming = useCallback(() => {
    getStreamingPlugin().api.streamContent.stop();
    setIsStreaming(false);
  }, []);

  // Stream intelligent content with ID-based replacement
  const handleStreamIntelligentContent = useCallback(async () => {
    if (!isStreaming) {
      handleStartStreaming();
    }

    // Simulate streaming content that gets updated/replaced
    const intelligentChunks: StreamChunk[] = [
      // Create initial heading
      createHeadingChunk('dynamic-heading', 'Loading...', 1),

      // Replace the heading with final content (same ID)
      createHeadingChunk('dynamic-heading', 'Streaming Content Example', 1),

      // Create initial paragraph
      createParagraphChunk('dynamic-paragraph', 'Initial content...'),

      // Replace paragraph with more content (same ID)
      createParagraphChunk('dynamic-paragraph', 'This paragraph was updated with new content.'),

      // Replace again with even more content (same ID)
      createParagraphChunk(
        'dynamic-paragraph',
        'This paragraph was updated multiple times with different content. The ID-based replacement allows for dynamic updates.'
      ),

      // Create a new paragraph (different ID)
      createParagraphChunk('final-paragraph', 'This is a new paragraph that was added.')
    ];

    for (const chunk of intelligentChunks) {
      // Stream the intelligent chunk
      getStreamingPlugin().api.streamContent.streamChunk(chunk);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    handleStopStreaming();
  }, [isStreaming, handleStartStreaming, handleStopStreaming]);

  // Simple test for intelligent replacement
  const handleSimpleIntelligentTest = useCallback(async () => {
    if (isStreaming) return;

    handleStartStreaming();

    // Test 1: First chunk
    const chunk1 = createParagraphChunk('test-paragraph', 'Hello world');
    getStreamingPlugin().api.streamContent.streamChunk(chunk1);

    // Test 2: Update same chunk
    setTimeout(() => {
      const chunk2 = createParagraphChunk('test-paragraph', 'Hello world! This is updated.');
      getStreamingPlugin().api.streamContent.streamChunk(chunk2);
    }, 1000);

    // Test 3: Update same chunk again
    setTimeout(() => {
      const chunk3 = createParagraphChunk(
        'test-paragraph',
        'Hello world! This is the final version.'
      );
      getStreamingPlugin().api.streamContent.streamChunk(chunk3);
    }, 2000);

    // Test 4: Add new chunk
    setTimeout(() => {
      const chunk4 = createParagraphChunk('new-paragraph', 'This is a new paragraph.');
      getStreamingPlugin().api.streamContent.streamChunk(chunk4);
    }, 3000);

    setTimeout(() => {
      handleStopStreaming();
    }, 4000);
  }, [isStreaming, handleStartStreaming, handleStopStreaming]);

  const handleStreamFullTest = useCallback(async () => {
    if (isStreaming) return;

    handleStartStreaming();
    const arrayOfContent = [
      createParagraphChunk('para-1', 'First paragraph'),
      createParagraphChunk('para-1', 'First paragraph this is a test'),
      createParagraphChunk('para-2', 'Second paragraph'),
      createParagraphChunk('para-3', 'Third paragraph'),
      createParagraphChunk('para-4', 'Fourth paragraph'),
      createParagraphChunk('para-5', 'Fifth paragraph'),
      createParagraphChunk('para-6', 'Sixth paragraph'),
      createParagraphChunk('para-7', 'Seventh paragraph')
    ];

    for await (const chunk of arrayOfContent) {
      getStreamingPlugin().api.streamContent.streamChunk(chunk);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    handleStopStreaming();
  }, [isStreaming, handleStartStreaming, handleStopStreaming]);

  // Stream custom Value content with IDs
  const handleStreamCustomValue = useCallback(async () => {
    if (!isStreaming) {
      handleStartStreaming();
    }

    // Simulate custom Value chunks from server with IDs
    const customChunks: StreamChunk[] = [
      createStreamChunk(
        'custom-heading',
        [{ type: 'h1', children: [{ text: 'Custom Value Streaming' }] }],
        'heading'
      ),
      createStreamChunk(
        'custom-paragraph-1',
        [
          {
            type: 'p',
            children: [
              { text: 'This is streaming content in ' },
              { text: 'Value', bold: true },
              { text: ' format directly from the server.' }
            ]
          }
        ],
        'paragraph'
      ),
      createStreamChunk(
        'custom-paragraph-2',
        [
          {
            type: 'p',
            children: [{ text: 'This paragraph will be replaced: ' }]
          }
        ],
        'paragraph'
      ),
      createStreamChunk(
        'custom-paragraph-2',
        [
          {
            type: 'p',
            children: [{ text: 'This paragraph was replaced with new content. ' }]
          }
        ],
        'paragraph'
      ),
      createStreamChunk(
        'custom-paragraph-2',
        [
          {
            type: 'p',
            children: [{ text: 'This paragraph was replaced again with final content!' }]
          }
        ],
        'paragraph'
      )
    ];

    for (const chunk of customChunks) {
      // Stream the custom Value chunk
      getStreamingPlugin().api.streamContent.streamChunk(chunk);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    handleStopStreaming();
  }, [isStreaming, handleStartStreaming, handleStopStreaming]);

  // Clear the editor
  const handleClear = useCallback(() => {
    editor.tf.selectAll();
    editor.tf.deleteBackward();
    editor.tf.insertNodes(
      [
        {
          type: 'p',
          children: [{ text: 'Editor cleared. Start typing or use streaming...' }]
        }
      ],
      { at: [0] }
    );
    // Add a default paragraph back
    // editor.tf.insertNodes(
    //   [
    //     {
    //       type: 'p',
    //       children: [{ text: 'Editor cleared. Start typing or use streaming...' }]
    //     }
    //   ],
    //   { at: [0] }
    // );
  }, []);

  // Get current streaming status
  const currentStreamingStatus = getStreamingPlugin().api.streamContent.isStreaming();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Enhanced Streaming Content Plugin Example</h1>

      <div style={{ marginBottom: '20px' }}>
        <h3>Controls</h3>
        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '10px'
          }}>
          <button
            onClick={handleStreamIntelligentContent}
            disabled={isStreaming}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: isStreaming ? 'not-allowed' : 'pointer'
            }}>
            Stream Intelligent Content
          </button>

          <button
            onClick={handleStreamCustomValue}
            disabled={isStreaming}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isStreaming ? 'not-allowed' : 'pointer'
            }}>
            Stream Custom Value
          </button>

          <button
            onClick={handleSimpleIntelligentTest}
            disabled={isStreaming}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isStreaming ? 'not-allowed' : 'pointer'
            }}>
            Simple Intelligent Test
          </button>

          <button
            onClick={handleStreamFullTest}
            disabled={isStreaming}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isStreaming ? 'not-allowed' : 'pointer'
            }}>
            Stream Full Test
          </button>

          <button
            onClick={handleClear}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
            Clear Editor
          </button>
        </div>

        <div style={{ fontSize: '14px', color: '#666' }}>
          <strong>Status:</strong> {currentStreamingStatus ? 'Streaming...' : 'Ready'}
        </div>
      </div>

      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          minHeight: '400px',
          backgroundColor: '#fff'
        }}>
        <Plate editor={editor}>
          <PlateContent
            style={{
              padding: '16px',
              minHeight: '400px',
              outline: 'none'
            }}
          />
        </Plate>
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>How it works:</h3>
        <ul>
          <li>
            <strong>Stream Text Content:</strong> Simple text streaming (backward compatibility)
          </li>
          <li>
            <strong>Stream Markdown:</strong> Markdown to Value conversion and streaming
          </li>
          <li>
            <strong>Stream Intelligent Content:</strong> Content with IDs that can append to
            existing nodes
          </li>
          <li>
            <strong>Stream Custom Value:</strong> Pre-formatted Value content with intelligent
            appending
          </li>
          <li>
            <strong>Stream Full:</strong> Efficient length-based updates for complete document state
          </li>
        </ul>

        <h3>Enhanced Features:</h3>
        <ul>
          <li>✅ Content ID tracking for intelligent appending</li>
          <li>✅ Append to existing nodes with same ID</li>
          <li>✅ Create new nodes when ID doesn't exist</li>
          <li>✅ Support for paragraphs, headings, and other block types</li>
          <li>✅ Real-time streaming with intelligent content management</li>
          <li>✅ TypeScript support with proper typing</li>
          <li>✅ Backward compatibility with simple streaming</li>
          <li>✅ Utility functions for creating different chunk types</li>
          <li>
            ✅ <strong>NEW:</strong> Efficient length-based updates with <code>streamFull</code>
          </li>
          <li>
            ✅ <strong>NEW:</strong> Complete document state management
          </li>
          <li>
            ✅ <strong>NEW:</strong> Smart truncation and expansion handling
          </li>
        </ul>

        <h3>Intelligent Streaming Logic:</h3>
        <ul>
          <li>
            <strong>Content ID Matching:</strong> When streaming content with an ID, the plugin
            checks if a node with that ID already exists
          </li>
          <li>
            <strong>Appending to Existing:</strong> If the node exists and{' '}
            <code>appendToExisting</code> is true, content is appended to the existing node
          </li>
          <li>
            <strong>Creating New Nodes:</strong> If no matching ID is found, a new node is created
          </li>
          <li>
            <strong>Text Appending:</strong> For text nodes (paragraphs, headings), text content is
            intelligently appended
          </li>
          <li>
            <strong>Block Appending:</strong> For other node types, new blocks are inserted after
            the existing node
          </li>
        </ul>
      </div>
    </div>
  );
}

/** Utility function to create a stream chunk with ID */
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

/** Utility function to create a paragraph chunk */
const createParagraphChunk = (id: string, text: string): StreamChunk => {
  return createStreamChunk(id, [{ type: 'p', children: [{ text }] }], 'paragraph');
};

/** Utility function to create a heading chunk */
const createHeadingChunk = (id: string, text: string, level: 1 | 2 | 3 = 1): StreamChunk => {
  return createStreamChunk(id, [{ type: `h${level}`, children: [{ text }] }], 'heading');
};

/** Utility function to convert string content to Value format */
const stringToValue = (text: string): Value => {
  return [
    {
      type: 'p',
      children: [{ text }]
    }
  ];
};
