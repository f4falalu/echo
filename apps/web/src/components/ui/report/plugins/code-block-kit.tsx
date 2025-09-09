import { CodeBlockPlugin, CodeLinePlugin, CodeSyntaxPlugin } from '@platejs/code-block/react';
// import javascript from 'highlight.js/lib/languages/javascript';
// import sql from 'highlight.js/lib/languages/sql';
// import typescript from 'highlight.js/lib/languages/typescript';
// import yaml from 'highlight.js/lib/languages/yaml';
import { common, createLowlight } from 'lowlight';
import { CodeBlockElement, CodeLineElement, CodeSyntaxLeaf } from '../elements/CodeBlockNode';

const lowlight = createLowlight();
const isClient = typeof window !== 'undefined';

if (isClient) {
  lowlight.register(common);
  // lowlight.register('yaml', yaml);
  // lowlight.register('javascript', javascript);
  // lowlight.register('typescript', typescript);
}

export const CodeBlockKit = [
  CodeBlockPlugin.configure({
    node: { component: CodeBlockElement },
    options: { lowlight, defaultLanguage: 'sql' },
    shortcuts: { toggle: { keys: 'mod+alt+8' } },
  }),
  CodeLinePlugin.withComponent(CodeLineElement),
  CodeSyntaxPlugin.withComponent(CodeSyntaxLeaf),
];
