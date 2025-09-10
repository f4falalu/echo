import { convertChildrenDeserialize, type MdNodeParser, serializeMd } from '@platejs/markdown';
import type { Descendant, TElement, Value } from 'platejs';

interface ToggleNode extends TElement {
  type: 'toggle';
  id?: string;
  children: Descendant[];
  _tempContent?: MdastNode[]; // Temporary storage for content paragraphs
  [key: string]: unknown;
}

interface IndentedNode extends TElement {
  indent?: number;
  id?: string;
  [key: string]: unknown;
}

interface MdastNode {
  type: string;
  name?: string;
  tagName?: string;
  children?: MdastNode[];
  value?: string;
}

const TOGGLE_POST_PROCESSING_KEY = 'toggle-post-processing';
const TOGGLE_POST_PROCESSING_MATCH = /<toggle-post-processing>(.*?)<\/toggle-post-processing>/;

export const toggleSerializer: MdNodeParser<'toggle'> = {
  serialize: (node, options) => {
    if (!options.editor) {
      throw new Error('Editor is required');
    }

    // Get the toggle title from the node's children (the summary text)
    const titleContent = serializeMd(options.editor, {
      ...options,
      value: node.children,
    }).trim();

    // Serialize to a special marker that we'll post-process
    return {
      type: 'html',
      value: `<${TOGGLE_POST_PROCESSING_KEY}>${titleContent}</${TOGGLE_POST_PROCESSING_KEY}>`,
    };
  },

  deserialize: (node, _, options) => {
    if (!options.editor) {
      throw new Error('Editor is required');
    }

    // Parse details/summary structure
    const mdastNode = node;

    if (mdastNode.name === 'details') {
      // Find summary content and collect other content
      let summaryChildren: Descendant[] = [];
      const contentParagraphs: MdastNode[] = [];

      if (mdastNode.children) {
        for (const child of mdastNode.children) {
          // Check if this paragraph contains a summary element
          if (child.type === 'paragraph' && child.children) {
            const summaryElement = child.children?.find(
              (grandchild: MdastNode) =>
                grandchild.type === 'mdxJsxTextElement' && grandchild.name === 'summary'
            );

            if (summaryElement?.children) {
              // Extract summary content preserving formatting
              try {
                summaryChildren = convertChildrenDeserialize(summaryElement.children, {}, options);
              } catch (error) {
                // Fallback to simple text extraction
                summaryChildren = [{ text: extractTextFromNode(summaryElement) }];
              }
            } else {
              // This is content - store it for post-processing
              contentParagraphs.push(child);
            }
          }
        }
      }

      // Create the toggle element with temporary content storage
      const toggleElement: ToggleNode = {
        type: 'toggle',
        children: summaryChildren.length > 0 ? summaryChildren : [{ text: '' }],
        id: generateId(),
        _tempContent: contentParagraphs, // Store content for post-processing
      };

      console.log('DEBUG: Created toggle element:', toggleElement);
      return toggleElement;
    }

    // Fallback for other node types
    return {
      type: 'toggle',
      children: [{ text: '' }],
      id: generateId(),
    } as ToggleNode;
  },
};

// Helper function to extract text content from a node
function extractTextFromNode(node: MdastNode): string {
  if (node.type === 'text') {
    return node.value || '';
  }

  if (node.children) {
    return node.children.map(extractTextFromNode).join('');
  }

  return '';
}

// Simple ID generator
function generateId(): string {
  return Math.random().toString(36).substr(2, 10);
}

// Post-processing function to handle details elements after deserialization
export function postProcessToggleDeserialization(elements: TElement[]): Value {
  const result: Value = [];

  for (const element of elements) {
    // Check if this is a toggle element with temporary content
    const toggleElement = element as ToggleNode;
    if (toggleElement.type === 'toggle' && toggleElement._tempContent) {
      // Convert the stored content paragraphs to indented elements
      const contentElements: TElement[] = [];

      for (const contentParagraph of toggleElement._tempContent) {
        if (contentParagraph.type === 'paragraph' && contentParagraph.children) {
          const paragraphText = extractTextFromNode(contentParagraph);
          if (paragraphText.trim()) {
            contentElements.push({
              type: 'p',
              children: [{ text: paragraphText.trim() }],
              indent: 1,
              id: generateId(),
            } as TElement);
          }
        }
      }

      // Clean up the toggle element (remove temp content)
      const cleanToggleElement: ToggleNode = {
        type: 'toggle',
        children: toggleElement.children,
        id: toggleElement.id,
      };

      // Add toggle followed by indented content
      result.push(cleanToggleElement);
      result.push(...contentElements);
    } else {
      // Keep other elements as-is
      result.push(element);
    }
  }

  return result;
}

// Post-processing function to convert toggle markers to details/summary format
export function postProcessToggleMarkdown(markdown: string): string {
  // This approach looks for toggle-post-processing markers followed by indented content
  // and groups them into details/summary blocks

  const lines = markdown.split('\n');
  const processedLines: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check if this line contains a toggle-post-processing marker
    const toggleMatch = line.match(TOGGLE_POST_PROCESSING_MATCH);

    if (toggleMatch) {
      const title = toggleMatch[1];

      // Start the details block
      processedLines.push('<details>');
      processedLines.push(`<summary>${title}</summary>`);
      processedLines.push(''); // Empty line after summary

      i++; // Move to next line

      // Simple approach: collect everything until we hit another toggle or end of document
      const toggleContent: string[] = [];

      while (i < lines.length) {
        const nextLine = lines[i];

        // Stop if we hit another toggle marker
        if (nextLine.includes(`<${TOGGLE_POST_PROCESSING_KEY}>`)) {
          break;
        }

        // Add this line to toggle content
        toggleContent.push(nextLine);
        i++;

        // Simple heuristic: if we hit two consecutive empty lines after some content, stop
        if (
          toggleContent.length > 1 &&
          nextLine.trim() === '' &&
          i < lines.length &&
          lines[i]?.trim() === ''
        ) {
          // Found two empty lines - this suggests end of toggle content
          break;
        }
      }

      // Add the collected content
      processedLines.push(...toggleContent);

      // Close the details block
      processedLines.push('</details>');

      // Add spacing after details if there's more content
      if (i < lines.length) {
        processedLines.push('');
      }
    } else {
      processedLines.push(line);
      i++;
    }
  }

  return processedLines.join('\n');
}
