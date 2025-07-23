'use client';

import pluralize from 'pluralize';
import React, { useEffect, useMemo, useState } from 'react';
import { Text } from '@/components/ui/typography';
import { FileCard } from '../../card/FileCard';
import { Button } from '../../buttons';
import { Copy2 } from '../../icons';
import { useMemoizedFn } from '@/hooks';
import { useBusterNotifications } from '@/context/BusterNotifications';
import dynamic from 'next/dynamic';

const SyntaxHighlighter = dynamic(
  () => import('@/components/ui/typography/SyntaxHighlight').then((mod) => mod.SyntaxHighlighter),
  { ssr: false }
);

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
}> = React.memo(
  ({
    isStreamFinished,
    fileName,
    buttons,
    collapsible = false,
    text,
    modified,
    animation = 'blur-in'
  }) => {
    const [lineSegments, setLineSegments] = useState<LineSegment[]>([]);
    const { openSuccessMessage } = useBusterNotifications();

    const copyToClipboard = useMemoizedFn(() => {
      navigator.clipboard.writeText(text);
      openSuccessMessage('Copied to clipboard');
    });

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

    useEffect(() => {
      const processText = () => {
        // Split the text into lines, keeping empty lines
        const lines = (text || '').split('\n');
        const segments: LineSegment[] = [];
        let currentLine = 1;

        if (!modified || modified.length === 0) {
          for (const line of lines) {
            segments.push({
              type: 'text',
              content: line,
              lineNumber: currentLine++
            });
          }
        } else {
          // Sort modified ranges to ensure proper processing
          const sortedModified = [...modified].sort((a, b) => a[0] - b[0]);

          let lastEnd = 0;
          for (const [start, end] of sortedModified) {
            // Add visible lines before the hidden section
            for (let i = lastEnd; i < start - 1; i++) {
              segments.push({
                type: 'text',
                content: lines[i],
                lineNumber: currentLine++
              });
            }

            // Add hidden section
            const hiddenLineCount = end - start + 1;
            segments.push({
              type: 'hidden',
              content: '',
              lineNumber: currentLine,
              numberOfLines: hiddenLineCount
            });
            currentLine += hiddenLineCount;
            lastEnd = end;
          }

          // Add remaining visible lines after the last hidden section
          for (let i = lastEnd; i < lines.length; i++) {
            segments.push({
              type: 'text',
              content: lines[i],
              lineNumber: currentLine++
            });
          }
        }

        setLineSegments(segments);
      };

      processText();
    }, [text, modified]);

    return (
      <FileCard collapsible={collapsible} fileName={fileName} headerButtons={buttonComponent}>
        <div className="w-full pr-0">
          <SyntaxHighlighter
            language={'yaml'}
            showLineNumbers
            startingLineNumber={1}
            animation={!isStreamFinished ? 'blurIn' : 'none'}
            className={'p-2.5 text-[10px]'}>
            {text}
          </SyntaxHighlighter>
        </div>
      </FileCard>
    );
  }
);

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
