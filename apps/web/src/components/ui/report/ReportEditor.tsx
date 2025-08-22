'use client';

import type { Value, AnyPluginConfig } from 'platejs';
import { Plate, type TPlateEditor } from 'platejs/react';
import React, { useImperativeHandle, useRef } from 'react';
import { useDebounceFn, useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/utils';
import { Editor } from './Editor';
import { EditorContainer } from './EditorContainer';
import { ThemeWrapper } from './ThemeWrapper/ThemeWrapper';
import { useReportEditor } from './useReportEditor';
import type { ReportElementsWithIds, ReportElementWithId } from '@buster/server-shared/reports';
import { platejsToMarkdown } from './plugins/markdown-kit/platejs-conversions';

interface ReportEditorProps {
  // We accept the generic Value type but recommend using ReportTypes.Value for type safety
  value?: string; //markdown
  initialElements?: Value | ReportElementWithId[];
  placeholder?: string;
  readOnly?: boolean;
  isStreaming?: boolean; //if true, the editor will be updated with the value prop when it is changed, everything will be readonly
  variant?: 'default';
  className?: string;
  containerClassName?: string;
  style?: React.CSSProperties;
  onValueChange?: (value: string) => void; //markdown
  useFixedToolbarKit?: boolean;
  onReady?: (editor: IReportEditor) => void;
  id?: string;
  mode?: 'export' | 'default';
  children?: React.ReactNode;
}

export type IReportEditor = TPlateEditor<Value, AnyPluginConfig>;

export interface AppReportRef {
  editor: TPlateEditor<Value, AnyPluginConfig> | null;
  onReset: () => void;
}

// AppReport is a functional component wrapped in forwardRef to allow parent components to access the underlying editor instance if needed.
export const ReportEditor = React.memo(
  React.forwardRef<AppReportRef, ReportEditorProps>(
    (
      {
        value,
        placeholder,
        initialElements,
        id,
        onValueChange,
        onReady,
        variant = 'default',
        className,
        containerClassName,
        style,
        mode = 'default',
        useFixedToolbarKit = false,
        readOnly = false,
        isStreaming = false,
        children
      },
      ref
    ) => {
      // Initialize the editor instance using the custom useEditor hook
      const isReady = useRef(false);

      const editor = useReportEditor({
        isStreaming,
        mode,
        readOnly,
        value,
        initialElements,
        useFixedToolbarKit
      });

      const onReset = useMemoizedFn(() => {
        if (!editor) {
          console.warn('Editor not yet initialized');
          return;
        }
        if (readOnly) {
          console.warn('Editor is read only');
          return;
        }
        editor.tf.reset();
      });

      // Optionally expose the editor instance to the parent via ref
      useImperativeHandle(ref, () => ({ editor, onReset }), [editor, { editor, onReset }]);

      const onValueChangePreflight = ({
        value,
        editor
      }: {
        value: Value;
        editor: TPlateEditor<Value, AnyPluginConfig>;
      }) => {
        if (isReady.current && !readOnly && onValueChange && !isStreaming) {
          platejsToMarkdown(editor, value as ReportElementsWithIds)
            .then((markdown) => {
              onValueChange(markdown);
            })
            .catch((error) => {
              console.error('Error converting platejs to markdown', error);
            });
        }

        if (!isReady.current) {
          onReady?.(editor);
          isReady.current = true;
        }
      };

      const { run: onValueChangeDebounced } = useDebounceFn(onValueChangePreflight, {
        wait: 1500
      });

      if (!editor) return null;

      return (
        <Plate
          editor={editor}
          readOnly={readOnly || isStreaming}
          onValueChange={onValueChangeDebounced}>
          <EditorContainer
            variant={variant}
            readOnly={readOnly}
            className={cn('editor-container relative overflow-auto', containerClassName)}>
            {children}
            <ThemeWrapper id={id}>
              <Editor
                style={style}
                placeholder={placeholder}
                className={cn('editor', className)}
                autoFocus
              />
            </ThemeWrapper>
          </EditorContainer>
        </Plate>
      );
    }
  )
);

ReportEditor.displayName = 'ReportEditor';
