'use client';

import { CodeBlockPlugin, CodeLinePlugin, CodeSyntaxPlugin } from '@platejs/code-block/react';
import { createLowlight } from 'lowlight';
import { KEYS, type AnyPluginConfig } from 'platejs';

import { ExitBreakRule } from '@udecode/plate-break';

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

export const CodeBlockKit: AnyPluginConfig[] = [
  CodeBlockPlugin.configure({
    node: {
      component: CodeBlockElement
      // Removed isVoid: true as it prevents content from displaying
    },
    options: { lowlight, defaultLanguage: 'sql' },
    rules: {
      // When pressing Enter at the end of a code block, create a paragraph
      break: { empty: 'reset' }
    },
    shortcuts: {
      toggle: { keys: 'mod+alt+8' }
    }
  }),
  CodeLinePlugin.withComponent(CodeLineElement),
  CodeSyntaxPlugin.withComponent(CodeSyntaxLeaf)
];
