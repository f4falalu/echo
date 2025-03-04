import React, { useEffect, useState } from 'react';
import { type ReasoningMessageProps } from '../ReasoningMessageSelector';
import {
  BusterChatMessageReasoning_file,
  type BusterChatMessageReasoning_files
} from '@/api/asset_interfaces';
import {
  AppCodeBlockWrapper,
  SyntaxHighlighterLightTheme
} from '@/components/ui/typography/AppCodeBlock';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { AnimatePresence, motion } from 'framer-motion';
import { LoaderDot } from './LoaderDot';
import { ReasoningFileButtons } from './ReasoningFileButtons';
import { ReasoningFileTitle } from './ReasoningFileTitle';

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

export type ReasoningMessageFileProps = BusterChatMessageReasoning_file & {
  chatId: string;
  isCompletedStream: boolean;
};

export const ReasoningMessage_File: React.FC<ReasoningMessageFileProps> = React.memo(
  ({
    file,
    file_name,
    chatId,
    file_type,
    version_id,
    version_number,
    status,
    isCompletedStream
  }) => {
    const showLoader = status === 'loading';
    const fileButtonType = status === 'loading' || !isCompletedStream ? 'status' : 'file';

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
      <AppCodeBlockWrapper
        title={<ReasoningFileTitle file_name={file_name} version_number={version_number} />}
        language={'yaml'}
        showCopyButton={false}
        buttons={
          <ReasoningFileButtons
            fileType={file_type}
            fileId={version_id}
            type={fileButtonType}
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
