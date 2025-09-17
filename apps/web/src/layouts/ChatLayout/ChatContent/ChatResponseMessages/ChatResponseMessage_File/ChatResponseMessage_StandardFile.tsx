import { Link } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import { ASSET_ICONS } from '@/components/features/icons/assetIcons';
import { CollapisbleFileCard } from '@/components/ui/card/CollapisbleFileCard';
import { Text } from '@/components/ui/typography';
import { TextAndVersionText } from '@/components/ui/typography/TextAndVersionText';
import type { ResponseMessageFileProps } from './ResponseMessageFile.types';

export const ChatResponseMessage_StandardFile: React.FC<ResponseMessageFileProps> = React.memo(
  ({ responseMessage, isSelectedFile, linkParams }) => {
    const { file_type, file_name, version_number } = responseMessage;

    const selectedIcon = useMemo(() => {
      if (file_type === 'metric_file') return <ASSET_ICONS.metrics />;
      if (file_type === 'dashboard_file') return <ASSET_ICONS.dashboards />;
      if (file_type === 'report_file') return <ASSET_ICONS.reports />;
      if (file_type === 'reasoning') return null;
      const _exhaustiveCheck: never = file_type;
      return null;
    }, [file_type]);

    const icon = useMemo(() => {
      if (!selectedIcon) return null;
      return (
        <Text size={'lg'} variant={'secondary'}>
          {selectedIcon}
        </Text>
      );
    }, [selectedIcon]);

    return (
      <Link {...linkParams} data-testid="chat-response-message-file">
        <CollapisbleFileCard
          fileName={<TextAndVersionText text={file_name} version={version_number} />}
          icon={icon}
          collapsible={false}
          selected={isSelectedFile}
        />
      </Link>
    );
  }
);

ChatResponseMessage_StandardFile.displayName = 'ChatResponseMessage_StandardFile';
