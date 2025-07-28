import React, { useImperativeHandle } from 'react';
import type { Value, AnyPluginConfig } from 'platejs';
import { Plate, type TPlateEditor } from 'platejs/react';
import { EditorContainer } from './EditorContainer';
import { EditorContent } from './EditorContent';
import { useEditor } from './useEditor';
import { useMemoizedFn } from '@/hooks';

interface AppReportProps {
  value: Value;
  placeholder?: string;
  readOnly?: boolean;
  variant?: 'default';
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

interface AppReportRef {
  editor: TPlateEditor<Value, AnyPluginConfig> | null;
  onReset: () => void;
}

// AppReport is a functional component wrapped in forwardRef to allow parent components to access the underlying editor instance if needed.
export const AppReport = React.memo(
  React.forwardRef<AppReportRef, AppReportProps>(
    (
      {
        value,
        placeholder,
        variant = 'default',
        className,
        style,
        readOnly = false,
        disabled = false
      },
      ref
    ) => {
      // Initialize the editor instance using the custom useEditor hook
      const editor = useEditor({ value, disabled });

      const onReset = useMemoizedFn(() => {
        editor?.tf.reset();
      });

      // Optionally expose the editor instance to the parent via ref
      useImperativeHandle(ref, () => ({ editor, onReset }), [editor]);

      return (
        <Plate editor={editor} readOnly={readOnly}>
          {/* 
            Toolbar is commented out for now. Uncomment and implement as needed.
            <FixedToolbar className="justify-start rounded-t-lg">
              <MarkToolbarButton nodeType="bold" tooltip="Bold (⌘+B)">
                B
              </MarkToolbarButton>
              <MarkToolbarButton nodeType="italic" tooltip="Italic (⌘+I)">
                I
              </MarkToolbarButton>
              <MarkToolbarButton nodeType="underline" tooltip="Underline (⌘+U)">
                U
              </MarkToolbarButton>
            </FixedToolbar> 
          */}
          <EditorContainer
            variant={variant}
            readonly={readOnly}
            disabled={disabled}
            className={className}>
            <EditorContent style={style} placeholder={placeholder} disabled={disabled} />
          </EditorContainer>
        </Plate>
      );
    }
  )
);

AppReport.displayName = 'AppReport';
