import isEmpty from 'lodash/isEmpty';
import type { LayoutSize } from '@/components/ui/layouts/AppLayout';
import {
  DEFAULT_BOTH_LAYOUT,
  DEFAULT_CHAT_ONLY_LAYOUT,
  DEFAULT_CHAT_OPTION_SIDEBAR_SIZE,
  DEFAULT_FILE_ONLY_LAYOUT,
  type LayoutMode,
  MAX_CHAT_BOTH_SIDEBAR_SIZE,
} from '@/layouts/ChatLayout/config';

export const getDefaultLayoutMode = ({
  chatId,
  assetParams,
}: {
  chatId: string | undefined;
  assetParams: Record<string, string>;
}): LayoutMode => {
  const isFileMode = isEmpty(assetParams) && !chatId;
  const isBothMode = !isEmpty(assetParams) && !isEmpty(chatId);

  if (isEmpty(assetParams)) {
    return 'chat-only';
  }

  if (isFileMode) {
    return 'file-only';
  }

  if (isBothMode) {
    return 'both';
  }

  return 'chat-only';
};

export const getDefaultLayout = ({ layout }: { layout: LayoutMode }): LayoutSize => {
  if (layout === 'chat-only') {
    return DEFAULT_CHAT_ONLY_LAYOUT;
  }

  if (layout === 'file-only') {
    return DEFAULT_FILE_ONLY_LAYOUT;
  }

  if (layout === 'both') {
    return DEFAULT_BOTH_LAYOUT;
  }

  return ['0px', 'auto'];
};

export const chooseInitialLayout = ({
  layout,
  initialLayout,
  defaultLayout,
}: {
  layout: LayoutMode;
  initialLayout: LayoutSize | null;
  defaultLayout: LayoutSize;
}): LayoutSize => {
  const firstValue = initialLayout?.[0];
  const secondValue = initialLayout?.[1];

  if (layout === 'chat-only') {
    if (firstValue === '0px' || firstValue !== 'auto') {
      return defaultLayout;
    }
  }

  if (layout === 'file-only') {
    if (firstValue === '0px' || firstValue !== 'auto') {
      return defaultLayout;
    }
  }

  if (layout === 'both') {
    if (firstValue === '0px' || secondValue === '0px') {
      return defaultLayout;
    }

    const isPxValue = firstValue?.toString().endsWith('px');
    if (isPxValue) {
      const firstValueNumber = parseInt(firstValue as string);
      //is bigger than max size
      if (firstValueNumber > parseInt(MAX_CHAT_BOTH_SIDEBAR_SIZE as string)) {
        return defaultLayout;
      }
      //is smaller than min size
      if (firstValueNumber < parseInt(DEFAULT_CHAT_OPTION_SIDEBAR_SIZE as string)) {
        return defaultLayout;
      }
    }
  }

  return initialLayout || defaultLayout;
};
