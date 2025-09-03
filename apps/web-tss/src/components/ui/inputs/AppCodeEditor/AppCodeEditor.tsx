//https://github.com/popsql/monaco-sql-languages/blob/main/example/src/App.js#L2
//https://dtstack.github.io/monaco-sql-languages/

import type { EditorProps, OnMount } from '@monaco-editor/react';
import { ClientOnly } from '@tanstack/react-router';
import type React from 'react';
import { forwardRef, lazy, Suspense, useCallback, useMemo } from 'react';
import { useMount } from '@/hooks/useMount';
import { cn } from '@/lib/utils';
import { isServer } from '@/lib/window';
import { LoadingCodeEditor } from './LoadingCodeEditor';
import { configureMonacoToUseYaml } from './yamlHelper';

let hasSetupMonacoWebWorker = false;

//https://github.com/brijeshb42/monaco-ace-tokenizer

const Editor = lazy(() =>
  import('@monaco-editor/react').then((mod) => {
    return {
      default: mod.Editor,
    };
  })
);

export interface AppCodeEditorProps {
  className?: string;
  onChangeEditorHeight?: (height: number) => void;
  height?: string;
  isDarkMode?: boolean;
  onMount?: OnMount;
  value?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
  language?: string;
  readOnly?: boolean;
  readOnlyMessage?: string;
  defaultValue?: string;
  monacoEditorOptions?: EditorProps['options'];
  variant?: 'bordered' | null;
  onMetaEnter?: () => void;
}

export interface AppCodeEditorHandle {
  resetCodeEditor: () => void;
}

export const AppCodeEditor = forwardRef<AppCodeEditorHandle, AppCodeEditorProps>(
  (
    {
      style,
      monacoEditorOptions,
      defaultValue = '',
      language = 'pgsql',
      className,
      readOnly,
      onChange,
      onChangeEditorHeight,
      height = '100%',
      isDarkMode,
      onMount,
      value,
      readOnlyMessage = 'Editing code is not allowed',
      variant,
      onMetaEnter,
    },
    _ref
  ) => {
    const useDarkMode = isDarkMode;

    const memoizedMonacoEditorOptions: EditorProps['options'] = useMemo(() => {
      return {
        language,
        readOnly,
        folding: true,
        lineDecorationsWidth: 15,
        lineNumbersMinChars: 3,
        tabSize: 7,
        wordWrap: 'off',
        wordWrapColumn: 999,
        wrappingStrategy: 'simple',
        overviewRulerLanes: 0,
        scrollBeyondLastLine: false,
        minimap: {
          enabled: false,
        },
        scrollbar: {
          horizontalScrollbarSize: 5,
          verticalScrollbarSize: 5,
          alwaysConsumeMouseWheel: false,
          useShadows: false,
        },
        padding: {
          top: 10,
        },
        hover: {
          enabled: false,
        },
        contextmenu: false,
        readOnlyMessage: {
          value: readOnlyMessage,
        },
        ...monacoEditorOptions,
      };
    }, [language, readOnly, readOnlyMessage, monacoEditorOptions]);

    useMount(async () => {
      if (hasSetupMonacoWebWorker || isServer) return;
      try {
        const setupMonacoWebWorker = await import('./setupMonacoWebWorker').then(
          (mod) => mod.setupMonacoWebWorker
        );
        setupMonacoWebWorker();
      } catch (error) {
        console.error('Error setting up Monaco web worker:', error);
      } finally {
        hasSetupMonacoWebWorker = true;
      }
    });

    const onMountCodeEditor: OnMount = useCallback(
      async (editor, monaco) => {
        const isYaml = language === 'yaml';

        const [GithubLightTheme, NightOwlTheme] = await Promise.all([
          (await import('./themes/github_light_theme')).default,
          (await import('./themes/tomorrow_night_theme')).default,
          isYaml ? await configureMonacoToUseYaml(monaco) : null,
        ]);

        type Theme = Parameters<typeof monaco.editor.defineTheme>[1];

        monaco.editor.defineTheme('github-light', GithubLightTheme as Theme);
        monaco.editor.defineTheme('night-owl', NightOwlTheme as Theme);
        editor.updateOptions({
          theme: useDarkMode ? 'night-owl' : 'github-light',
          colorDecorators: true,
        });
        if (onChangeEditorHeight) {
          const contentSizeDisposable = editor.onDidContentSizeChange(() => {
            const contentHeight = editor.getContentHeight();
            onChangeEditorHeight(contentHeight);
          });
          // Ensure our listener is disposed with the editor
          editor.onDidDispose(() => {
            contentSizeDisposable.dispose();
          });
        }

        if (language === 'yaml') {
          //   await configureMonacoToUseYaml(monaco);
        }

        onMount?.(editor, monaco);

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
          onMetaEnter?.();
        });
      },
      [onChangeEditorHeight, language, onMount, useDarkMode, onMetaEnter]
    );

    const onChangeCodeEditor = useCallback(
      (v: string | undefined) => {
        if (!readOnly) {
          onChange?.(v || '');
        }
      },
      [onChange, readOnly]
    );

    return (
      <div
        className={cn(
          'app-code-editor relative h-full w-full border',
          variant === 'bordered' && 'overflow-hidden border',
          className
        )}
        style={style}
      >
        <ClientOnly fallback={<LoadingCodeEditor />}>
          <Suspense fallback={<LoadingCodeEditor />}>
            <Editor
              key={useDarkMode ? 'dark' : 'light'}
              height={height}
              language={language}
              className={className}
              defaultValue={defaultValue}
              value={value}
              theme={useDarkMode ? 'night-owl' : 'github-light'}
              onMount={onMountCodeEditor}
              onChange={onChangeCodeEditor}
              options={memoizedMonacoEditorOptions}
              loading={<LoadingCodeEditor />}
            />
          </Suspense>
        </ClientOnly>
      </div>
    );
  }
);
AppCodeEditor.displayName = 'AppCodeEditor';
