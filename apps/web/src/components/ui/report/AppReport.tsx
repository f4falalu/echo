import React from 'react';
import type { Value } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';
import { BoldPlugin, ItalicPlugin, UnderlinePlugin } from '@platejs/basic-nodes/react';
import { EditorContainer } from './EditorContainer';
import { EditorContent } from './EditorContent';

interface AppReportProps {
  value: Value;
  placeholder?: string;
  readonly?: boolean;
  variant?: 'default';
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const AppReport = React.memo(
  ({
    value,
    placeholder,
    readonly,
    variant = 'default',
    className,
    style,
    disabled = false
  }: AppReportProps) => {
    const editor = usePlateEditor({
      plugins: [BoldPlugin, ItalicPlugin, UnderlinePlugin],
      value: []
    });

    return (
      <Plate editor={editor}>
        {/* <FixedToolbar className="justify-start rounded-t-lg">
          <MarkToolbarButton nodeType="bold" tooltip="Bold (⌘+B)">
            B
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="italic" tooltip="Italic (⌘+I)">
            I
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="underline" tooltip="Underline (⌘+U)">
            U
          </MarkToolbarButton>
        </FixedToolbar> */}
        <EditorContainer
          variant={variant}
          readonly={readonly}
          disabled={disabled}
          className={className}>
          <EditorContent style={style} placeholder={placeholder} disabled={disabled} />
        </EditorContainer>
      </Plate>
    );
  }
);

AppReport.displayName = 'AppReport';
