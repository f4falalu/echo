import isEmpty from 'lodash/isEmpty';
import { useMemo } from 'react';
import type { LayoutSize } from '@/components/ui/layouts/AppLayout';
import { useIsBothMode, useIsFileMode } from './useMode';

export const useSelectedLayoutMode = () => {
  const isBothMode = useIsBothMode();
  const isFileMode = useIsFileMode();

  if (isFileMode) {
    return 'file-only' as const;
  }

  if (isBothMode) {
    return 'both' as const;
  }

  return 'chat-only' as const;
};

export const getDefaultLayout = ({
  chatId,
  assetParams,
}: {
  chatId: string | undefined;
  assetParams: Record<string, string>;
}): LayoutSize => {
  if (isEmpty(assetParams)) {
    return ['auto', '0px'];
  }

  if (!chatId) {
    return ['0px', 'auto'];
  }

  if (chatId) {
    return ['380px', 'auto'];
  }

  return ['0px', 'auto'];
};
