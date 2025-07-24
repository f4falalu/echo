import React, { useMemo } from 'react';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { DropdownContent, DropdownItems, type DropdownItem } from '@/components/ui/dropdown';
import { History, Star } from '@/components/ui/icons';
import { Star as StarFilled } from '@/components/ui/icons/NucleoIconFilled';
import { useListVersionDropdownItems } from '../versionHistory/useListVersionDropdownItems';
import { useFavoriteStar } from '../list';

export const useVersionHistorySelectMenu = ({ metricId }: { metricId: string }): DropdownItem => {
  const chatId = useChatLayoutContextSelector((x) => x.chatId);

  const { data } = useGetMetric(
    { id: metricId },
    {
      select: (x) => ({
        versions: x.versions,
        version_number: x.version_number
      })
    }
  );
  const { versions = [], version_number } = data || {};

  const versionHistoryItems: DropdownItems = useListVersionDropdownItems({
    versions,
    selectedVersion: version_number,
    chatId,
    fileId: metricId,
    fileType: 'metric',
    useVersionHistoryMode: true
  });

  const reverseVersionHistoryItems = useMemo(() => {
    return [...versionHistoryItems].reverse();
  }, [versionHistoryItems]);

  return useMemo(
    () => ({
      label: 'Version history',
      value: 'version-history',
      icon: <History />,
      items: [
        <React.Fragment key="version-history-sub-menu">
          <DropdownContent items={reverseVersionHistoryItems} selectType="single" />
        </React.Fragment>
      ]
    }),
    [reverseVersionHistoryItems]
  );
};

export const useFavoriteMetricSelectMenu = ({ metricId }: { metricId: string }) => {
  const { data: name } = useGetMetric({ id: metricId }, { select: (x) => x.name });
  const { isFavorited, onFavoriteClick } = useFavoriteStar({
    id: metricId,
    type: 'metric',
    name: name || ''
  });

  const item: DropdownItem = useMemo(
    () => ({
      label: isFavorited ? 'Remove from favorites' : 'Add to favorites',
      value: 'add-to-favorites',
      icon: isFavorited ? <StarFilled /> : <Star />,
      onClick: onFavoriteClick
    }),
    [isFavorited, onFavoriteClick]
  );

  return item;
};
