import React, { useEffect, useMemo, useState } from 'react';
import { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { BusterChatMessageReasoning_file } from '@/api/asset_interfaces';
import {
  AppCodeBlockWrapper,
  SyntaxHighlighterLightTheme
} from '@/components/text/AppMarkdown/AppCodeBlock';
import { useBusterStylesContext } from '@/context/BusterStyles';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { AnimatePresence, motion } from 'framer-motion';
import { TextPulseLoader } from '@/components/loaders';

const style = SyntaxHighlighterLightTheme;

const container = {
  hidden: { opacity: 0, height: 0 },
  show: {
    opacity: 1,
    height: 'auto',
    transition: {
      opacity: { duration: 0.12 },
      staggerChildren: 0.08
    }
  }
};

const item = {
  hidden: { opacity: 0, x: 0 },
  show: { opacity: 1, x: 0 }
};

export const ReasoningMessage_File: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessage, isCompletedStream, isLastMessageItem }) => {
    const { file, file_name, file_chunk } = reasoningMessage as BusterChatMessageReasoning_file;
    const isDarkMode = useBusterStylesContext((s) => s.isDarkMode);

    const showLoader = !isCompletedStream && isLastMessageItem;

    // Initialize with complete file if available
    const [lineMap, setLineMap] = useState<Map<number, string>>(() => {
      const initialMap = new Map<number, string>();
      if (file) {
        file.forEach((chunk) => {
          initialMap.set(chunk.line_number, chunk.text);
        });
      }
      return initialMap;
    });

    // Append new chunks as they arrive
    useEffect(() => {
      if (file_chunk) {
        setLineMap((prevMap) => {
          const newMap = new Map(prevMap);
          file_chunk.forEach((chunk) => {
            const existingLine = prevMap.get(chunk.line_number) || '';
            newMap.set(chunk.line_number, existingLine + chunk.text);
          });
          return newMap;
        });
      }
    }, [file_chunk]);

    return (
      <AppCodeBlockWrapper
        title={file_name}
        language={'yaml'}
        showCopyButton={false}
        isDarkMode={isDarkMode}>
        <AnimatePresence>
          <motion.div
            className="w-full overflow-x-auto p-3"
            variants={container}
            initial="hidden"
            animate="show"
            exit="exit">
            <div className="border border-red-500">
              {Array.from(lineMap.entries()).map(([lineNumber, text]) => (
                <motion.div
                  key={lineNumber}
                  variants={item}
                  className="line-number border border-blue-500">
                  <MemoizedSyntaxHighlighter lineNumber={lineNumber} text={text} />
                </motion.div>
              ))}
            </div>
            {showLoader && <LoaderDot />}
          </motion.div>
        </AnimatePresence>
      </AppCodeBlockWrapper>
    );
  }
);

const LoaderDot = React.memo(() => {
  return (
    <div className="-mt-0.5 pl-1">
      <TextPulseLoader />
    </div>
  );
});

LoaderDot.displayName = 'LoaderDot';

ReasoningMessage_File.displayName = 'ReasoningMessage_File';

const lineNumberStyles = { color: '#000' };
const MemoizedSyntaxHighlighter = React.memo(
  ({ lineNumber, text }: { lineNumber: number; text: string }) => {
    return (
      <SyntaxHighlighter
        style={style}
        language={'yaml'}
        key={lineNumber}
        showLineNumbers
        wrapLines
        wrapLongLines
        startingLineNumber={lineNumber}
        lineNumberStyle={lineNumberStyles}
        className={`!m-0 !border-none !p-0`}>
        {text}
      </SyntaxHighlighter>
    );
  }
);
