/**
 * Toggle Serializer for PlateJS Markdown Kit
 *
 * This module handles the serialization and deserialization of toggle/collapsible content
 * between PlateJS editor format and Markdown's <details>/<summary> HTML structure.
 *
 * Key Features:
 * - Converts PlateJS toggle elements to HTML details/summary blocks
 * - Handles proper nesting of content within toggles
 * - Provides post-processing functions for complete toggle support
 * - Maintains formatting integrity during conversion
 */

import { convertChildrenDeserialize, type MdNodeParser, serializeMd } from '@platejs/markdown';
import type { Descendant, TElement, Value } from 'platejs';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Represents a toggle node in the PlateJS editor structure
 */
interface ToggleNode extends TElement {
  type: 'toggle';
  id?: string;
  children: Descendant[];
  _tempContent?: MdastNode[]; // Temporary storage for nested content during processing
  [key: string]: unknown;
}

/**
 * Represents a node with indentation (used for nested toggle content)
 */
interface IndentedNode extends TElement {
  indent?: number;
  id?: string;
  [key: string]: unknown;
}

/**
 * Represents a Markdown AST node structure
 */
interface MdastNode {
  type: string;
  name?: string;
  tagName?: string;
  children?: MdastNode[];
  value?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Temporary marker used during serialization post-processing */
const TOGGLE_POST_PROCESSING_KEY = 'toggle-post-processing';

/** Regex pattern to match toggle post-processing markers */
const TOGGLE_POST_PROCESSING_MATCH = /<toggle-post-processing>(.*?)<\/toggle-post-processing>/;

/** Default indentation level for nested toggle content */
const DEFAULT_TOGGLE_INDENT = 1;

// =============================================================================
// MAIN SERIALIZER
// =============================================================================

/**
 * Main toggle serializer that handles conversion between PlateJS and Markdown
 *
 * The serializer works in two phases:
 * 1. Initial serialization creates temporary markers
 * 2. Post-processing converts markers to proper HTML structure
 */
export const toggleSerializer: MdNodeParser<'toggle'> = {
  serialize: (node, options) => {
    validateSerializationOptions(options);

    const titleContent = extractToggleTitle(node as ToggleNode, options);

    // Create temporary marker for post-processing
    return createTemporaryToggleMarker(titleContent);
  },

  deserialize: (node, _, options) => {
    validateDeserializationOptions(options);

    return deserializeToggleNode(node as MdastNode, options);
  },
};

// =============================================================================
// SERIALIZATION HELPERS
// =============================================================================

/**
 * Validates that required options are present for serialization
 */
function validateSerializationOptions(options: { editor?: unknown }): void {
  if (!options.editor) {
    throw new Error('Editor is required for toggle serialization');
  }
}

/**
 * Extracts the title content from a toggle node's children
 */
function extractToggleTitle(
  node: ToggleNode,
  options: { editor?: unknown; value?: unknown }
): string {
  return serializeMd(options.editor as Parameters<typeof serializeMd>[0], {
    ...options,
    value: node.children,
  }).trim();
}

/**
 * Creates a temporary HTML marker for post-processing
 */
function createTemporaryToggleMarker(titleContent: string): { type: string; value: string } {
  return {
    type: 'html',
    value: `<${TOGGLE_POST_PROCESSING_KEY}>${titleContent}</${TOGGLE_POST_PROCESSING_KEY}>`,
  };
}

// =============================================================================
// DESERIALIZATION HELPERS
// =============================================================================

/**
 * Validates that required options are present for deserialization
 */
function validateDeserializationOptions(options: { editor?: unknown }): void {
  if (!options.editor) {
    throw new Error('Editor is required for toggle deserialization');
  }
}

/**
 * Deserializes a Markdown AST node into a PlateJS toggle element
 */
function deserializeToggleNode(mdastNode: MdastNode, options: Record<string, unknown>): ToggleNode {
  if (mdastNode.name === 'details') {
    return processDetailsElement(mdastNode, options);
  }

  // Fallback for unrecognized node types
  return createEmptyToggleElement();
}

/**
 * Processes a details HTML element and extracts toggle structure
 */
function processDetailsElement(mdastNode: MdastNode, options: Record<string, unknown>): ToggleNode {
  const { summaryChildren, contentParagraphs } = extractToggleComponents(mdastNode, options);

  return createToggleElement(summaryChildren, contentParagraphs);
}

/**
 * Extracts summary and content components from a details element
 */
function extractToggleComponents(
  mdastNode: MdastNode,
  options: Record<string, unknown>
): { summaryChildren: Descendant[]; contentParagraphs: MdastNode[] } {
  let summaryChildren: Descendant[] = [];
  const contentParagraphs: MdastNode[] = [];

  if (!mdastNode.children) {
    return { summaryChildren, contentParagraphs };
  }

  for (const child of mdastNode.children) {
    if (child.type === 'paragraph' && child.children) {
      const summaryElement = findSummaryElement(child);

      if (summaryElement?.children) {
        summaryChildren = extractSummaryContent(summaryElement, options);
      } else {
        // This is toggle content, not the summary
        contentParagraphs.push(child);
      }
    }
  }

  return { summaryChildren, contentParagraphs };
}

/**
 * Finds the summary element within a paragraph's children
 */
function findSummaryElement(paragraph: MdastNode): MdastNode | undefined {
  return paragraph.children?.find(
    (child: MdastNode) => child.type === 'mdxJsxTextElement' && child.name === 'summary'
  );
}

/**
 * Extracts and converts summary content to PlateJS format
 */
function extractSummaryContent(
  summaryElement: MdastNode,
  options: Record<string, unknown>
): Descendant[] {
  try {
    return convertChildrenDeserialize(
      summaryElement.children as Parameters<typeof convertChildrenDeserialize>[0],
      {},
      options
    );
  } catch (error) {
    // Fallback to simple text extraction if conversion fails
    console.warn('Failed to convert summary content, falling back to text extraction:', error);
    return [{ text: extractTextFromNode(summaryElement) }];
  }
}

/**
 * Creates a complete toggle element with summary and content
 */
function createToggleElement(
  summaryChildren: Descendant[],
  contentParagraphs: MdastNode[]
): ToggleNode {
  return {
    type: 'toggle',
    children: summaryChildren.length > 0 ? summaryChildren : [{ text: '' }],
    id: generateUniqueId(),
    _tempContent: contentParagraphs,
  };
}

/**
 * Creates an empty toggle element as a fallback
 */
function createEmptyToggleElement(): ToggleNode {
  return {
    type: 'toggle',
    children: [{ text: '' }],
    id: generateUniqueId(),
  };
}

// =============================================================================
// POST-PROCESSING FUNCTIONS
// =============================================================================

/**
 * Post-processes deserialized elements to properly handle toggle content
 *
 * This function converts temporary toggle storage into proper indented content
 * that follows the toggle in the document structure.
 */
export function postProcessToggleDeserialization(elements: TElement[]): Value {
  const result: Value = [];

  for (const element of elements) {
    const processedElements = processToggleElement(element);
    result.push(...processedElements);
  }

  return result;
}

/**
 * Processes a single element, handling toggle-specific logic
 */
function processToggleElement(element: TElement): TElement[] {
  if (element.type === 'toggle') {
    const toggleElement = element as ToggleNode;
    if (toggleElement._tempContent) {
      return processToggleWithContent(toggleElement);
    }
  }

  return [element];
}

/**
 * Processes a toggle element that has temporary content to be converted
 */
function processToggleWithContent(toggleElement: ToggleNode): TElement[] {
  const contentElements = convertToggleContentToElements(toggleElement._tempContent || []);
  const cleanToggleElement = createCleanToggleElement(toggleElement);

  return [cleanToggleElement, ...contentElements];
}

/**
 * Converts temporary toggle content to proper indented elements
 */
function convertToggleContentToElements(contentParagraphs: MdastNode[]): TElement[] {
  const contentElements: TElement[] = [];

  for (const contentParagraph of contentParagraphs) {
    const element = convertParagraphToElement(contentParagraph);
    if (element) {
      contentElements.push(element);
    }
  }

  return contentElements;
}

/**
 * Converts a single paragraph to an indented PlateJS element
 */
function convertParagraphToElement(contentParagraph: MdastNode): TElement | null {
  if (contentParagraph.type === 'paragraph' && contentParagraph.children) {
    const paragraphText = extractTextFromNode(contentParagraph);

    if (paragraphText.trim()) {
      return {
        type: 'p',
        children: [{ text: paragraphText.trim() }],
        indent: DEFAULT_TOGGLE_INDENT,
        id: generateUniqueId(),
      } as TElement;
    }
  }

  return null;
}

/**
 * Creates a clean toggle element without temporary content
 */
function createCleanToggleElement(toggleElement: ToggleNode): ToggleNode {
  return {
    type: 'toggle',
    children: toggleElement.children,
    id: toggleElement.id,
  };
}

/**
 * Post-processes markdown text to convert toggle markers to HTML details/summary
 *
 * This function handles the final conversion from temporary markers to proper
 * HTML structure that can be rendered as collapsible content.
 */
export function postProcessToggleMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  const processedLines: string[] = [];
  let lineIndex = 0;

  while (lineIndex < lines.length) {
    lineIndex = processMarkdownLine(lines, lineIndex, processedLines);
  }

  return processedLines.join('\n');
}

/**
 * Processes a single line of markdown, handling toggle markers
 */
function processMarkdownLine(
  lines: string[],
  currentIndex: number,
  processedLines: string[]
): number {
  const line = lines[currentIndex];
  const toggleMatch = line.match(TOGGLE_POST_PROCESSING_MATCH);

  if (toggleMatch) {
    return processToggleMarker(lines, currentIndex, toggleMatch[1], processedLines);
  }

  processedLines.push(line);
  return currentIndex + 1;
}

/**
 * Processes a toggle marker and converts it to HTML details/summary structure
 */
function processToggleMarker(
  lines: string[],
  startIndex: number,
  title: string,
  processedLines: string[]
): number {
  // Add details opening tags
  processedLines.push('<details>');
  processedLines.push(`<summary>${title}</summary>`);
  processedLines.push('');

  const currentIndex = startIndex + 1;
  const toggleContent = collectToggleContent(lines, currentIndex);

  // Add collected content
  processedLines.push(...toggleContent.content);

  // Close details block
  processedLines.push('</details>');

  // Add spacing if there's more content
  if (toggleContent.endIndex < lines.length) {
    processedLines.push('');
  }

  return toggleContent.endIndex;
}

/**
 * Collects content lines that belong to a toggle until a natural break point
 */
function collectToggleContent(
  lines: string[],
  startIndex: number
): { content: string[]; endIndex: number } {
  const content: string[] = [];
  let currentIndex = startIndex;

  while (currentIndex < lines.length) {
    const line = lines[currentIndex];

    // Stop at another toggle marker
    if (line.includes(`<${TOGGLE_POST_PROCESSING_KEY}>`)) {
      break;
    }

    content.push(line);
    currentIndex++;

    // Stop at double empty lines (natural break point)
    if (shouldStopAtDoubleEmptyLines(content, lines, currentIndex)) {
      break;
    }
  }

  return { content, endIndex: currentIndex };
}

/**
 * Determines if we should stop collecting toggle content at double empty lines
 */
function shouldStopAtDoubleEmptyLines(
  content: string[],
  lines: string[],
  currentIndex: number
): boolean {
  return (
    content.length > 1 &&
    content[content.length - 1].trim() === '' &&
    currentIndex < lines.length &&
    lines[currentIndex]?.trim() === ''
  );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Recursively extracts text content from a Markdown AST node
 */
function extractTextFromNode(node: MdastNode): string {
  if (node.type === 'text') {
    return node.value || '';
  }

  if (node.children) {
    return node.children.map(extractTextFromNode).join('');
  }

  return '';
}

/**
 * Generates a unique identifier for PlateJS elements
 */
function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 12);
}
