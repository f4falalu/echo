import { FileType } from '@/api/asset_interfaces/chat';
import { DropdownItems } from '@/components/ui/dropdown';
import { useGetFileLink } from '@/context/Assets/useGetFileLink';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { timeFromNow } from '@/lib/date';
import { useMemo } from 'react';

export const useListVersionDropdownItems = ({
  versions,
  selectedVersion,
  chatId,
  fileId,
  fileType,
  useVersionHistoryMode
}: {
  selectedVersion: number | undefined;
  versions: {
    version_number: number;
    updated_at: string;
  }[];
  chatId: string | undefined;
  fileId: string;
  fileType: FileType;
  useVersionHistoryMode: boolean;
}) => {
  const { getFileLink } = useGetFileLink();
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);

  const onClickLink = useMemoizedFn((versionNumber: number) => {
    const link = getFileLink({
      fileId,
      fileType,
      chatId,
      useVersionHistoryMode,
      versionNumber
    });

    if (link) onChangePage(link);
  });

  const versionHistoryItems: DropdownItems = useMemo(() => {
    return versions.map((x) => ({
      label: `Version ${x.version_number}`,
      secondaryLabel: timeFromNow(x.updated_at, false),
      value: x.version_number.toString(),
      selected: x.version_number === selectedVersion,
      onClick: () => onClickLink(x.version_number)
    }));
  }, [versions, selectedVersion, chatId, fileId, fileType, getFileLink, onChangePage]);

  return versionHistoryItems;
};
