'use client';

import type { ReportElementsWithIds, ReportElementWithId } from '@buster/server-shared/reports';
import type { Value, AnyPluginConfig } from 'platejs';
import { Plate, type TPlateEditor } from 'platejs/react';
import React, { useImperativeHandle, useRef } from 'react';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/utils';
import { Editor } from './Editor';
import { EditorContainer } from './EditorContainer';
import { ThemeWrapper } from './ThemeWrapper/ThemeWrapper';
import { useReportEditor } from './useReportEditor';

interface ReportEditorProps {
  // We accept the generic Value type but recommend using ReportTypes.Value for type safety
  value: ReportElementsWithIds;
  placeholder?: string;
  readOnly?: boolean;
  isStreaming?: boolean; //if true, the editor will be updated with the value prop when it is changed, everything will be readonly
  variant?: 'default';
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  onValueChange?: (value: ReportElementsWithIds) => void;
  useFixedToolbarKit?: boolean;
  onReady?: (editor: IReportEditor) => void;
  id?: string;
  mode?: 'export' | 'default';
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
        disabled = false,
        isStreaming = false
      },
      ref
    ) => {
      // Initialize the editor instance using the custom useEditor hook
      const isReady = useRef(false);

      const editor = useReportEditor({ isStreaming, mode, value, disabled, useFixedToolbarKit });

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

      const onValueChangePreflight = useMemoizedFn(
        ({ value, editor }: { value: Value; editor: TPlateEditor<Value, AnyPluginConfig> }) => {
          if (isReady.current && !readOnly) {
            onValueChange?.(cleanValueToReportElements(value));
          }

          if (!isReady.current) {
            onReady?.(editor);
            isReady.current = true;
          }
        }
      );

      if (!editor) return null;

      return (
        <ThemeWrapper id={id}>
          <Plate editor={editor} readOnly={readOnly} onValueChange={onValueChangePreflight}>
            <EditorContainer
              variant={variant}
              readonly={readOnly}
              disabled={disabled}
              className={containerClassName}>
              <Editor
                style={style}
                placeholder={placeholder}
                disabled={disabled}
                className={cn('pb-[20vh]', className)}
                autoFocus
              />
            </EditorContainer>
          </Plate>
        </ThemeWrapper>
      );
    }
  )
);

ReportEditor.displayName = 'ReportEditor';

const cleanValueToReportElements = (value: Value): ReportElementsWithIds => {
  const filteredElements: ReportElementsWithIds = value
    .filter((element) => element.type !== 'slash_input')
    .map<ReportElementWithId>((element) => {
      // If the element has a children array, filter its children as well
      if (Array.isArray(element.children)) {
        return {
          ...element,
          children: element.children.filter((child) => {
            return child.type !== 'slash_input';
          })
        } as ReportElementWithId;
      }
      return element as ReportElementWithId;
    });

  return filteredElements;
};
