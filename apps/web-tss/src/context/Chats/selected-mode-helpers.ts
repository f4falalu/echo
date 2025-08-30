import isEmpty from 'lodash/isEmpty';
import type { LayoutSize } from '@/components/ui/layouts/AppLayout';

export type LayoutMode = 'file-only' | 'both' | 'chat-only';

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
    return ['auto', '0px'];
  }

  if (layout === 'file-only') {
    return ['0px', 'auto'];
  }

  if (layout === 'both') {
    return ['380px', 'auto'];
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
    if (firstValue === '0px') {
      return defaultLayout;
    }
  }

  if (layout === 'file-only') {
    if (firstValue === '0px') {
      return defaultLayout;
    }
  }

  if (layout === 'both') {
    if (firstValue === '0px' || secondValue === '0px') {
      return defaultLayout;
    }
  }

  return initialLayout || defaultLayout;
};
