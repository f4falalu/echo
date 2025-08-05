import type { Descendant, PluginConfig, TElement, TNode } from 'platejs';
import { createPlatePlugin, type PlateElementProps } from 'platejs/react';
import { useMemo } from 'react';

// Helper function to recursively count characters in editor nodes
const countCharactersInNodes = (nodes: (TNode | Descendant)[]): number => {
  let count = 0;

  for (const node of nodes) {
    if ('text' in node && typeof node.text === 'string') {
      // This is a text node
      count += node.text.length;
    } else if ('children' in node && Array.isArray(node.children)) {
      // This is an element node with children
      count += countCharactersInNodes(node.children);
    }
  }

  return count;
};

export const CharacterCounterPlugin = createPlatePlugin<
  'characterCounter',
  {
    maxLength: number;
    showWarning: boolean;
    warningThreshold: number;
  },
  {},
  {},
  {
    maxLength: number;
    showWarning: boolean;
    warningThreshold: number;
  }
>({
  key: 'characterCounter',
  options: {
    maxLength: 40,
    showWarning: true,
    warningThreshold: 0.9
  },
  handlers: {
    onKeyDown: ({ editor, event, ...rest }) => {
      const options = editor.getOptions(CharacterCounterPlugin);
      const { maxLength } = options;

      // Get the current block where the user is typing
      const currentBlock = editor.api.block();

      // Get current character count for only the current block
      let currentLength = 0;
      if (currentBlock) {
        const [blockNode] = currentBlock;
        currentLength = countCharactersInNodes(blockNode.children || []);
      }

      // Check if we're at or over the limit
      if (currentLength >= maxLength) {
        // Allow certain keys that don't add characters
        const allowedKeys = [
          'Backspace',
          'Delete',
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          'Home',
          'End',
          'PageUp',
          'PageDown',
          'Tab',
          'Escape',
          'Enter' // You might want to allow Enter for line breaks
        ];

        // Allow Ctrl/Cmd combinations (like copy, paste, undo, etc.)
        const isModifierPressed = event.ctrlKey || event.metaKey;

        // If it's not an allowed key and no modifier is pressed, prevent the input
        if (!allowedKeys.includes(event.key) && !isModifierPressed) {
          event.preventDefault();
          return false;
        }
      }

      return true;
    }
  },
  node: {
    component: ({ element, children, getOptions }: CharacterElementCounterProps) => {
      const options = getOptions();
      const { maxLength, showWarning, warningThreshold } = options;

      // Get the character length of only this component's content
      const characterLength = useMemo(() => {
        return countCharactersInNodes(element.children);
      }, [element.children]);

      // Calculate warning state
      const warningLength = maxLength * warningThreshold;
      const isOverWarning = characterLength >= warningLength;
      const isOverLimit = characterLength > maxLength;

      return (
        <div className="rounded-md bg-purple-100 p-2 text-black">
          <div className="mb-2 text-sm" contentEditable={false}>
            Character count: {characterLength} / {maxLength}
            {showWarning && isOverWarning && (
              <span className={`ml-2 ${isOverLimit ? 'text-red-600' : 'text-yellow-600'}`}>
                {isOverLimit ? '⚠️ Limit exceeded!' : '⚠️ Approaching limit'}
              </span>
            )}
          </div>
          {children}
        </div>
      );
    },
    isElement: true
  }
});

type CharacterElementCounterProps = PlateElementProps<
  TElement,
  PluginConfig<
    'characterCounter',
    {
      maxLength: number;
      showWarning: boolean;
      warningThreshold: number;
    }
  >
>;
