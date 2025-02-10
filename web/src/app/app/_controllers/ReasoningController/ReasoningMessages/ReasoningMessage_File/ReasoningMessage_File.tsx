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
            newMap.set(chunk.line_number, chunk.text);
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
        <div className="p-3">
          {Array.from(lineMap.entries()).map(([lineNumber, text]) => (
            <MemoizedSyntaxHighlighter lineNumber={lineNumber} text={text} key={lineNumber} />
          ))}

          {showLoader && <LoaderDot />}
        </div>
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

const MemoizedSyntaxHighlighter = React.memo(
  ({ lineNumber, text }: { lineNumber: number; text: string }) => {
    return (
      <SyntaxHighlighter
        style={style}
        language={'yaml'}
        key={lineNumber}
        className={`!m-0 !border-none !p-0`}>
        {text}
      </SyntaxHighlighter>
    );
  }
);
