'use client';

import React, { useImperativeHandle, useRef } from 'react';
import type { Value, AnyPluginConfig } from 'platejs';
import { Plate, type TPlateEditor } from 'platejs/react';
import { EditorContainer } from './EditorContainer';
import { Editor } from './Editor';
import { useReportEditor } from './useReportEditor';
import { useMemoizedFn } from '@/hooks';
import type { ReportElements, ReportElement } from '@buster/server-shared/reports';
import { cn } from '@/lib/utils';
import { ThemeWrapper } from './ThemeWrapper/ThemeWrapper';

interface ReportEditorProps {
  // We accept the generic Value type but recommend using ReportTypes.Value for type safety
  value: ReportElements;
  placeholder?: string;
  readOnly?: boolean;
  variant?: 'default';
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  onValueChange?: (value: ReportElements) => void;
  useFixedToolbarKit?: boolean;
  onReady?: (editor: IReportEditor) => void;
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
        onValueChange,
        onReady,
        variant = 'default',
        className,
        containerClassName,
        style,
        useFixedToolbarKit = false,
        readOnly = false,
        disabled = false
      },
      ref
    ) => {
      // Initialize the editor instance using the custom useEditor hook
      const isReady = useRef(false);

      const editor = useReportEditor({ value, disabled, useFixedToolbarKit, onReady });

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
      useImperativeHandle(ref, () => ({ editor, onReset }), [editor]);

      const onValueChangePreflight = useMemoizedFn(
        ({ value, editor }: { value: Value; editor: TPlateEditor<Value, AnyPluginConfig> }) => {
          if (readOnly) {
            console.warn('Editor is read only');
            return;
          }
          if (isReady.current) {
            onValueChange?.(cleanValueToReportElements(value));
          }

          isReady.current = true;
        }
      );

      if (!editor) return null;

      return (
        <ThemeWrapper>
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

const cleanValueToReportElements = (value: Value): ReportElements => {
  const filteredElements: ReportElements = value
    .filter((element) => element.type !== 'slash_input')
    .map<ReportElement>((element) => {
      // If the element has a children array, filter its children as well
      if (Array.isArray(element.children)) {
        return {
          ...element,
          children: element.children.filter((child) => {
            return child.type !== 'slash_input';
          })
        } as ReportElement;
      }
      return element as ReportElement;
    });

  return filteredElements;
};
