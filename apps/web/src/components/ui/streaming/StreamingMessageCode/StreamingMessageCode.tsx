import pluralize from 'pluralize';
import React, { useMemo, useState } from 'react';
import { Text } from '@/components/ui/typography';
//THIS USED TO BE DYNAMIC...
import { SyntaxHighlighter } from '@/components/ui/typography/SyntaxHighlight/SyntaxHighlighter';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { Button } from '../../buttons';
import { FileCard } from '../../card/FileCard';
import { Copy2 } from '../../icons';

type LineSegment = {
  type: 'text' | 'hidden';
  content: string;
  lineNumber: number;
  numberOfLines?: number;
};

export const StreamingMessageCode: React.FC<{
  isStreamFinished: boolean;
  collapsible?: 'chevron' | 'overlay-peek' | false;
  buttons?: React.ReactNode | null;
  fileName: string | React.ReactNode | null;
  text: string;
  modified?: [number, number][];
  animation?: 'blur-in' | 'fade-in';
}> = React.memo(({ isStreamFinished, fileName, buttons, collapsible = false, text }) => {
  const { openSuccessMessage } = useBusterNotifications();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    openSuccessMessage('Copied to clipboard');
  };

  const buttonComponent = useMemo(() => {
    if (buttons === null) {
      return null;
    }

    if (!buttons) {
      return (
        <div className="flex justify-end">
          <Button prefix={<Copy2 />} variant="ghost" onClick={copyToClipboard}>
            Copy
          </Button>
        </div>
      );
    }
    return buttons;
  }, [buttons]);

  return (
    <FileCard collapsible={collapsible} fileName={fileName} headerButtons={buttonComponent}>
      <div className="w-full pr-0">
        <SyntaxHighlighter
          language={'yaml'}
          showLineNumbers
          startingLineNumber={1}
          animation={!isStreamFinished ? 'blurIn' : 'none'}
          className={'p-2.5 text-[10px]'}
        >
          {text}
        </SyntaxHighlighter>
      </div>
    </FileCard>
  );
});

StreamingMessageCode.displayName = 'StreamingMessageCode';

const HiddenSection: React.FC<{
  numberOfLinesUnmodified: number;
}> = ({ numberOfLinesUnmodified }) => (
  <div className="my-2! flex w-full items-center space-x-1 first:mt-0">
    <div className="bg-border h-[0.5px] w-full" />
    <Text variant="tertiary" size={'xs'} className="whitespace-nowrap">
      {`${numberOfLinesUnmodified} ${pluralize('line', numberOfLinesUnmodified)} unmodified`}
    </Text>
    <div className="bg-border h-[0.5px] w-4" />
  </div>
);
