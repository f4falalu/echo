import type React from 'react';
import { useMemo } from 'react';
import type { BusterChatMessageReasoning_file } from '@/api/asset_interfaces';
import { StreamingMessageCode } from '@/components/ui/streaming/StreamingMessageCode';
import { Text } from '@/components/ui/typography';
import { TextAndVersionPill } from '@/components/ui/typography/TextAndVersionPill';

export const ReasoningFileCode: React.FC<
  BusterChatMessageReasoning_file & {
    isStreamFinished: boolean;
    collapsible?: 'chevron' | 'overlay-peek' | false;
    buttons?: React.ReactNode;
  }
> = ({
  isStreamFinished,
  file,
  file_type,
  file_name,
  version_number,
  buttons,
  collapsible = false,
}) => {
  const { text = '', modified } = file;

  const fileInfo: React.ReactNode = useMemo(() => {
    if (file_type === 'dashboard_file' || file_type === 'metric_file') {
      return <TextAndVersionPill fileName={file_name} versionNumber={version_number} />;
    }

    return <Text>{file_name}</Text>;
  }, [file_name, version_number, file_type]);

  return (
    <StreamingMessageCode
      fileName={fileInfo}
      text={text}
      modified={modified}
      collapsible={collapsible}
      buttons={buttons}
      isStreamFinished={isStreamFinished}
    />
  );
};
