import { formatCodeBlock, isLangSupported } from '@platejs/code-block';
import { NodeApi, type TCodeBlockElement, type TCodeSyntaxLeaf } from 'platejs';
import {
  PlateElement,
  type PlateElementProps,
  PlateLeaf,
  type PlateLeafProps,
  useEditorRef,
  useElement,
  useReadOnly,
} from 'platejs/react';
import * as React from 'react';
import { Button } from '@/components/ui/buttons';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { cn } from '@/lib/utils';
import { Select } from '../../select';
import { NodeTypeIcons } from '../config/icons';
import { NodeTypeLabels } from '../config/labels';

/*
This is used for code blocks.
*/
export function CodeBlockElement(props: PlateElementProps<TCodeBlockElement>) {
  const { editor, element } = props;

  return (
    <PlateElement
      className="group flex flex-col bg-item-select relative px-2.5 pt-1 pb-6 my-2.5"
      {...props}
    >
      <div
        className="w-full flex items-center justify-between gap-0.5 py-0.5 select-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        contentEditable={false}
      >
        <CodeBlockCombobox />

        <CopyButton value={() => NodeApi.string(element)} />
      </div>
      <div className={cn('rounded py-2 px-2.5')}>
        <pre
          spellCheck={false}
          className={cn(
            'overflow-x-auto  font-mono text-base leading-[normal] [tab-size:2] print:break-inside-avoid',
            ' **:[.hljs-addition]:bg-[#f0fff4] **:[.hljs-addition]:text-[#22863a] dark:**:[.hljs-addition]:bg-[#3c5743] dark:**:[.hljs-addition]:text-[#ceead5] **:[.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable]:text-[#005cc5] dark:**:[.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable]:text-[#6596cf] **:[.hljs-built\\\\_in,.hljs-symbol]:text-[#e36209] dark:**:[.hljs-built\\\\_in,.hljs-symbol]:text-[#c3854e] **:[.hljs-bullet]:text-[#735c0f] **:[.hljs-comment,.hljs-code,.hljs-formula]:text-[#6a737d] dark:**:[.hljs-comment,.hljs-code,.hljs-formula]:text-[#6a737d] **:[.hljs-deletion]:bg-[#ffeef0] **:[.hljs-deletion]:text-[#b31d28] dark:**:[.hljs-deletion]:bg-[#473235] dark:**:[.hljs-deletion]:text-[#e7c7cb] **:[.hljs-emphasis]:italic **:[.hljs-keyword,.hljs-doctag,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language\\\\_]:text-[#d73a49] dark:**:[.hljs-keyword,.hljs-doctag,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language\\\\_]:text-[#ee6960] **:[.hljs-name,.hljs-quote,.hljs-selector-tag,.hljs-selector-pseudo]:text-[#22863a] dark:**:[.hljs-name,.hljs-quote,.hljs-selector-tag,.hljs-selector-pseudo]:text-[#36a84f] **:[.hljs-regexp,.hljs-string,.hljs-meta_.hljs-string]:text-[#032f62] dark:**:[.hljs-regexp,.hljs-string,.hljs-meta_.hljs-string]:text-[#3593ff] **:[.hljs-section]:font-semibold **:[.hljs-section]:text-[#005cc5] dark:**:[.hljs-section]:text-[#61a5f2] **:[.hljs-strong]:font-semibold **:[.hljs-title,.hljs-title.class\\\\_,.hljs-title.class\\\\_.inherited\\\\_\\\\_,.hljs-title.function\\\\_]:text-[#6f42c1] dark:**:[.hljs-title,.hljs-title.class\\\\_,.hljs-title.class\\\\_.inherited\\\\_\\\\_,.hljs-title.function\\\\_]:text-[#a77bfa]'
          )}
        >
          <code>{props.children}</code>
        </pre>
      </div>
    </PlateElement>
  );
}

const CodeBlockCombobox = React.memo(() => {
  const readOnly = useReadOnly();
  const editor = useEditorRef();
  const element = useElement<TCodeBlockElement>();
  const value = element.lang || 'plaintext';
  const [searchValue, setSearchValue] = React.useState('');

  const items = React.useMemo(
    () =>
      languages.filter(
        (language) =>
          !searchValue || language.label.toLowerCase().includes(searchValue.toLowerCase())
      ),
    [searchValue]
  );

  if (readOnly) return null;

  return (
    <Select
      className="w-fit"
      inputClassName="min-w-[4ch] max-w-[30ch] cursor-pointer field-sizing-content w-fit!"
      variant="ghost"
      size="small"
      items={items}
      value={value}
      search
      type="select"
      onChange={(value) => {
        editor.tf.setNodes<TCodeBlockElement>({ lang: value }, { at: element });
        setSearchValue('');
      }}
      onPressEnter={(value) => {
        const isValue = items.find((item) => item.value === value);
        if (isValue) {
          editor.tf.setNodes<TCodeBlockElement>({ lang: value }, { at: element });
          setSearchValue('');
        }
      }}
      closeOnSelect
    />
  );
});

CodeBlockCombobox.displayName = 'CodeBlockCombobox';

function CopyButton({
  value,
}: { value: (() => string) | string } & Omit<React.ComponentProps<typeof Button>, 'value'>) {
  const [hasCopied, setHasCopied] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const { openInfoMessage } = useBusterNotifications();

  const clearTimeoutRef = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  React.useEffect(() => {
    return () => {
      clearTimeoutRef();
    };
  }, []);

  return (
    <Button
      variant="ghost"
      className="text-[11px]"
      size={'small'}
      prefix={hasCopied ? <NodeTypeIcons.check /> : <NodeTypeIcons.copy />}
      onClick={() => {
        void navigator.clipboard.writeText(typeof value === 'function' ? value() : value);
        openInfoMessage('Code copied to clipboard');
        setHasCopied(true);
        clearTimeoutRef();
        timeoutRef.current = setTimeout(() => {
          setHasCopied(false);
        }, 3500);
      }}
    >
      {NodeTypeLabels.copy.label}
    </Button>
  );
}

export function CodeLineElement(props: PlateElementProps) {
  return <PlateElement {...props} />;
}

export function CodeSyntaxLeaf(props: PlateLeafProps<TCodeSyntaxLeaf>) {
  const tokenClassName = props.leaf.className as string;

  return <PlateLeaf className={tokenClassName} {...props} />;
}

const languages: { label: string; value: string }[] = [
  // { label: 'Auto', value: 'auto' },
  { label: NodeTypeLabels.plainText.label, value: 'plaintext' },
  // { label: 'ABAP', value: 'abap' },
  // { label: 'Agda', value: 'agda' },
  // { label: 'Arduino', value: 'arduino' },
  // { label: 'ASCII Art', value: 'ascii' },
  // { label: 'Assembly', value: 'x86asm' },
  { label: 'Bash', value: 'bash' },
  // { label: 'BASIC', value: 'basic' },
  // { label: 'BNF', value: 'bnf' },
  // { label: 'C', value: 'c' },
  // { label: 'C#', value: 'csharp' },
  // { label: 'C++', value: 'cpp' },
  // { label: 'Clojure', value: 'clojure' },
  // { label: 'CoffeeScript', value: 'coffeescript' },
  // { label: 'Coq', value: 'coq' },
  // { label: 'CSS', value: 'css' },
  // { label: 'Dart', value: 'dart' },
  // { label: 'Dhall', value: 'dhall' },
  // { label: 'Diff', value: 'diff' },
  // { label: 'Docker', value: 'dockerfile' },
  // { label: 'EBNF', value: 'ebnf' },
  // { label: 'Elixir', value: 'elixir' },
  // { label: 'Elm', value: 'elm' },
  // { label: 'Erlang', value: 'erlang' },
  // { label: 'F#', value: 'fsharp' },
  // { label: 'Flow', value: 'flow' },
  // { label: 'Fortran', value: 'fortran' },
  // { label: 'Gherkin', value: 'gherkin' },
  // { label: 'GLSL', value: 'glsl' },
  // { label: 'Go', value: 'go' },
  // { label: 'GraphQL', value: 'graphql' },
  // { label: 'Groovy', value: 'groovy' },
  // { label: 'Haskell', value: 'haskell' },
  // { label: 'HCL', value: 'hcl' },
  // { label: 'HTML', value: 'html' },
  // { label: 'Idris', value: 'idris' },
  // { label: 'Java', value: 'java' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'JSON', value: 'json' },
  // { label: 'Julia', value: 'julia' },
  // { label: 'Kotlin', value: 'kotlin' },
  // { label: 'LaTeX', value: 'latex' },
  // { label: 'Less', value: 'less' },
  // { label: 'Lisp', value: 'lisp' },
  // { label: 'LiveScript', value: 'livescript' },
  // { label: 'LLVM IR', value: 'llvm' },
  // { label: 'Lua', value: 'lua' },
  // { label: 'Makefile', value: 'makefile' },
  // { label: 'Markdown', value: 'markdown' },
  // { label: 'Markup', value: 'markup' },
  // { label: 'MATLAB', value: 'matlab' },
  // { label: 'Mathematica', value: 'mathematica' },
  // { label: 'Mermaid', value: 'mermaid' },
  // { label: 'Nix', value: 'nix' },
  // { label: 'Notion Formula', value: 'notion' },
  // { label: 'Objective-C', value: 'objectivec' },
  // { label: 'OCaml', value: 'ocaml' },
  // { label: 'Pascal', value: 'pascal' },
  // { label: 'Perl', value: 'perl' },
  // { label: 'PHP', value: 'php' },
  // { label: 'PowerShell', value: 'powershell' },
  // { label: 'Prolog', value: 'prolog' },
  // { label: 'Protocol Buffers', value: 'protobuf' },
  // { label: 'PureScript', value: 'purescript' },
  // { label: 'Python', value: 'python' },
  // { label: 'R', value: 'r' },
  // { label: 'Racket', value: 'racket' },
  // { label: 'Reason', value: 'reasonml' },
  // { label: 'Ruby', value: 'ruby' },
  // { label: 'Rust', value: 'rust' },
  // { label: 'Sass', value: 'scss' },
  // { label: 'Scala', value: 'scala' },
  // { label: 'Scheme', value: 'scheme' },
  // { label: 'SCSS', value: 'scss' },
  // { label: 'Shell', value: 'shell' },
  // { label: 'Smalltalk', value: 'smalltalk' },
  // { label: 'Solidity', value: 'solidity' },
  { label: 'SQL', value: 'sql' },
  // { label: 'Swift', value: 'swift' },
  // { label: 'TOML', value: 'toml' },
  { label: 'TypeScript', value: 'typescript' },
  // { label: 'VB.Net', value: 'vbnet' },
  // { label: 'Verilog', value: 'verilog' },
  // { label: 'VHDL', value: 'vhdl' },
  // { label: 'Visual Basic', value: 'vbnet' },
  // { label: 'WebAssembly', value: 'wasm' },
  // { label: 'XML', value: 'xml' },
  { label: 'YAML', value: 'yaml' },
];
