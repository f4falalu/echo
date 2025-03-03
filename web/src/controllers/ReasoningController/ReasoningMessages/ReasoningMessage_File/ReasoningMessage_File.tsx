import React, { useEffect, useState } from 'react';
import { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { BusterChatMessageReasoning_file } from '@/api/asset_interfaces';
import {
  AppCodeBlockWrapper,
  SyntaxHighlighterLightTheme
} from '@/components/ui/text/AppMarkdown/AppCodeBlock';
import { useBusterStylesContext } from '@/context/BusterStyles';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { AnimatePresence, motion } from 'framer-motion';
import { LoaderDot } from './LoaderDot';
import { ReasoningFileButtons } from './ReasoningFileButtons';
import { ReasoningFileTitle } from './ReasoningFileTitle';
import { BarContainer } from '../BarContainer';

const style = SyntaxHighlighterLightTheme;

const containerVariants = {
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

const itemVariants = {
  hidden: { opacity: 0, x: 0 },
  show: { opacity: 1, x: 0 }
};

export const ReasoningMessage_File: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessage, isCompletedStream, isLastMessageItem, chatId }) => {
    const { file, file_name, file_type, version_id, version_number, status } =
      reasoningMessage as BusterChatMessageReasoning_file;
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
      if (file) {
        setLineMap((prevMap) => {
          const newMap = new Map(prevMap);
          file.forEach((chunk) => {
            newMap.set(chunk.line_number, chunk.text);
          });
          return newMap;
        });
      }
    }, [file]);

    return (
      <BarContainer
        showBar={true}
        status={status ?? 'loading'}
        isCompletedStream={isCompletedStream}
        title={file_name}
        secondaryTitle={`v${version_number}`}
        contentClassName="mb-2">
        <AppCodeBlockWrapper
          title={<ReasoningFileTitle file_name={file_name} version_number={version_number} />}
          language={'yaml'}
          showCopyButton={false}
          isDarkMode={isDarkMode}
          buttons={
            <ReasoningFileButtons
              fileType={file_type}
              fileId={version_id}
              isCompletedStream={isCompletedStream}
              chatId={chatId}
            />
          }>
          <AnimatePresence initial={!isCompletedStream}>
            <motion.div
              className="w-full overflow-x-auto p-3"
              variants={containerVariants}
              initial="hidden"
              animate="show">
              {Array.from(lineMap.entries()).map(([lineNumber, text]) => (
                <motion.div
                  key={lineNumber}
                  variants={itemVariants}
                  className="line-number w-fit pr-1">
                  <MemoizedSyntaxHighlighter lineNumber={lineNumber} text={text} />
                </motion.div>
              ))}

              {showLoader && <LoaderDot />}
            </motion.div>
          </AnimatePresence>
        </AppCodeBlockWrapper>
      </BarContainer>
    );
  }
);

ReasoningMessage_File.displayName = 'ReasoningMessage_File';

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
