'use client';

import { BusterChatMessageReasoning_file } from '@/api/asset_interfaces';
import {
  AppCodeBlockWrapper,
  SyntaxHighlighterLightTheme
} from '@/components/ui/typography/AppCodeBlock';
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Text } from '@/components/ui/typography';
import pluralize from 'pluralize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { StreamingMessageCodeTitle } from './StreamingMessageCodeTitle';
import { TextPulseLoader } from '../../loaders/PulseLoader';

const style = SyntaxHighlighterLightTheme;

type LineSegment = {
  type: 'text' | 'hidden';
  content: string;
  lineNumber: number;
  numberOfLines?: number;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      opacity: { duration: 0.12 },
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: 0 },
  show: { opacity: 1, x: 0 }
};

export const StreamingMessageCode: React.FC<
  BusterChatMessageReasoning_file & {
    isCompletedStream: boolean;
    buttons?: React.ReactNode;
  }
> = ({
  status,
  isCompletedStream,
  file,
  file_name,
  version_number,
  file_type,
  version_id,
  buttons
}) => {
  const showLoader = status === 'loading' && !isCompletedStream;
  const { text = '', modified } = file;

  const [lineSegments, setLineSegments] = useState<LineSegment[]>([]);

  useEffect(() => {
    const processText = () => {
      // Split the text into lines, keeping empty lines
      const lines = (text || '').split('\n');
      const segments: LineSegment[] = [];
      let currentLine = 1;

      if (!modified || modified.length === 0) {
        // If no modified ranges, process the entire text as visible
        lines.forEach((line) => {
          segments.push({
            type: 'text',
            content: line,
            lineNumber: currentLine++
          });
        });
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
    <AppCodeBlockWrapper
      title={<StreamingMessageCodeTitle file_name={file_name} version_number={version_number} />}
      language={'yaml'}
      showCopyButton={false}
      buttons={buttons}>
      <AnimatePresence initial={!isCompletedStream}>
        <motion.div
          className="w-full overflow-x-auto p-3"
          variants={containerVariants}
          initial="hidden"
          animate="show">
          {lineSegments.map((segment, index) => (
            <motion.div
              key={`${segment.lineNumber}-${index}`}
              variants={itemVariants}
              className="line-number pr-1">
              {segment.type === 'text' ? (
                <MemoizedSyntaxHighlighter lineNumber={segment.lineNumber} text={segment.content} />
              ) : (
                <HiddenSection numberOfLinesUnmodified={segment.numberOfLines || 0} />
              )}
            </motion.div>
          ))}
          {showLoader && <TextPulseLoader className="pl-2" />}
        </motion.div>
      </AnimatePresence>
    </AppCodeBlockWrapper>
  );
};

const HiddenSection: React.FC<{
  numberOfLinesUnmodified: number;
}> = ({ numberOfLinesUnmodified }) => (
  <div className="my-2 flex w-full items-center space-x-1 first:mt-0">
    <div className="bg-border h-[0.5px] w-full" />
    <Text variant="tertiary" size={'sm'} className="whitespace-nowrap">
      {`${numberOfLinesUnmodified} ${pluralize('line', numberOfLinesUnmodified)} unmodified`}
    </Text>
    <div className="bg-border h-[0.5px] w-4" />
  </div>
);

const lineNumberStyles: React.CSSProperties = {
  minWidth: '2.25em'
};
const MemoizedSyntaxHighlighter = React.memo(
  ({ lineNumber, text }: { lineNumber: number; text: string }) => {
    return (
      <SyntaxHighlighter
        style={style}
        language={'yaml'}
        showLineNumbers
        startingLineNumber={lineNumber}
        lineNumberStyle={lineNumberStyles}
        lineNumberContainerStyle={{ color: 'red' }}
        className={`m-0! w-fit! border-none! p-0!`}>
        {text}
      </SyntaxHighlighter>
    );
  }
);

MemoizedSyntaxHighlighter.displayName = 'MemoizedSyntaxHighlighter';
