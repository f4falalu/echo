'use client';

import { CodeBlockPlugin, CodeLinePlugin, CodeSyntaxPlugin } from '@platejs/code-block/react';
import { createLowlight } from 'lowlight';

import { CodeBlockElement, CodeLineElement, CodeSyntaxLeaf } from '../elements/CodeBlockNode';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';

const lowlight = createLowlight();

lowlight.register('sql', sql);
lowlight.register('yaml', yaml);
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);

export const CodeBlockKit = [
  CodeBlockPlugin.configure({
    node: {
      component: CodeBlockElement
      // Removed isVoid: true as it prevents content from displaying
    },
    options: { lowlight, defaultLanguage: 'sql' },
    shortcuts: {
      toggle: { keys: 'mod+alt+8' }
      // Add shortcuts for easy deletion
      // deleteBackward: {
      //   keys: 'Backspace',
      //   handler: ({ editor }) => {
      //     // Check if there's a selection
      //     if (!editor.selection) return false;

      //     // Find the current CodeBlock node
      //     const codeBlockEntry = editor.api.above({
      //       match: { type: 'code_block' },
      //       at: editor.selection
      //     });

      //     if (codeBlockEntry) {
      //       // Remove the entire CodeBlock node
      //       editor.tf.removeNodes({ at: codeBlockEntry[1] });
      //       return true; // Prevent default backspace behavior
      //     }

      //     return false; // Allow default behavior if not in a code block
      //   }
      // },
      // deleteForward: {
      //   keys: 'Delete',
      //   handler: ({ editor }) => {
      //     // Check if there's a selection
      //     if (!editor.selection) return false;

      //     // Find the current CodeBlock node
      //     const codeBlockEntry = editor.api.above({
      //       match: { type: 'code_block' },
      //       at: editor.selection
      //     });

      //     if (codeBlockEntry) {
      //       // Remove the entire CodeBlock node
      //       editor.tf.removeNodes({ at: codeBlockEntry[1] });
      //       return true; // Prevent default delete behavior
      //     }

      //     return false; // Allow default behavior if not in a code block
      //   }
      // }
    }
  }),
  CodeLinePlugin.withComponent(CodeLineElement),
  CodeSyntaxPlugin.withComponent(CodeSyntaxLeaf)
];
