import { ShareAssetType, VerificationStatus, BusterChatListItem } from '@/api/asset_interfaces';
import { makeHumanReadble, formatDate } from '@/utils';
import React, { memo, useMemo, useRef, useState } from 'react';
import { StatusBadgeIndicator, getShareStatus } from '../../_components/Lists';
import { BusterUserAvatar, Text } from '@/components';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useMemoizedFn } from 'ahooks';
import { BusterListColumn, BusterListRow } from '@/components/ui/list';
import { ChatSelectedOptionPopup } from './ChatItemsSelectedPopup';
import { BusterList, ListEmptyStateWithButton } from '@/components/ui/list';
import { FavoriteStar } from '../../_components/Lists';
import { useCreateListByDate } from '@/components/ui/list/useCreateListByDate';

export const ChatItemsContainer: React.FC<{
  chats: BusterChatListItem[];
  className?: string;
  openNewMetricModal: () => void;
  loading: boolean;
}> = ({ chats = [], className = '', loading, openNewMetricModal }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const renderedDates = useRef<Record<string, string>>({});
  const renderedOwners = useRef<Record<string, React.ReactNode>>({});
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const onSelectChange = useMemoizedFn((selectedRowKeys: string[]) => {
    setSelectedRowKeys(selectedRowKeys);
  });
  const hasSelected = selectedRowKeys.length > 0;

  const logsRecord = useCreateListByDate({ data: chats });

  const chatsByDate: BusterListRow[] = useMemo(() => {
    return Object.entries(logsRecord).flatMap(([key, chats]) => {
      const records = chats.map((chat) => ({
        id: chat.id,
        data: chat,
        link: createBusterRoute({
          route: BusterRoutes.APP_CHAT_ID,
          chatId: chat.id
        })
      }));
      const hasRecords = records.length > 0;

      if (!hasRecords) return [];

      return [
        {
          id: key,
          data: {},
          rowSection: {
            title: makeHumanReadble(key),
            secondaryTitle: String(records.length)
          }
        },
        ...records
      ];
    });
  }, [logsRecord]);

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        dataIndex: 'title',
        title: 'Title',
        render: (title, record) => (
          <TitleCell title={title} status={record?.status} chatId={record?.id} />
        )
      },
      {
        dataIndex: 'last_edited',
        title: 'Last updated',
        width: 132,
        render: (v) => {
          if (renderedDates.current[v]) {
            return renderedDates.current[v];
          }
          const date = formatDate({ date: v, format: 'lll' });
          renderedDates.current[v] = date;
          return date;
        }
      },
      { dataIndex: 'dataset_name', title: 'Dataset', width: 115 },
      {
        dataIndex: 'is_shared',
        title: 'Sharing',
        width: 65,
        render: (v) => getShareStatus({ is_shared: v })
      },
      {
        dataIndex: 'created_by_name',
        title: 'Owner',
        width: 45,
        render: (name, record) => {
          if (renderedOwners.current[name]) {
            return renderedOwners.current[name];
          }
          const avatarCell = (
            <OwnerCell name={name} image={record?.created_by_avatar || undefined} />
          );
          renderedOwners.current[name] = avatarCell;
          return avatarCell;
        }
      }
    ],
    []
  );

  return (
    <div
      ref={tableContainerRef}
      className={`${className} relative flex h-full flex-col items-center`}>
      <BusterList
        rows={chatsByDate}
        columns={columns}
        onSelectChange={onSelectChange}
        selectedRowKeys={selectedRowKeys}
        emptyState={<EmptyState loading={loading} openNewMetricModal={openNewMetricModal} />}
      />

      <ChatSelectedOptionPopup
        selectedRowKeys={selectedRowKeys}
        onSelectChange={onSelectChange}
        hasSelected={hasSelected}
      />
    </div>
  );
};

const EmptyState: React.FC<{
  loading: boolean;
  openNewMetricModal: () => void;
}> = React.memo(({ loading, openNewMetricModal }) => {
  if (loading) {
    return <></>;
  }

  return <ChatsEmptyState openNewMetricModal={openNewMetricModal} />;
});
EmptyState.displayName = 'EmptyState';

const ChatsEmptyState: React.FC<{
  openNewMetricModal: () => void;
}> = ({ openNewMetricModal }) => {
  return (
    <ListEmptyStateWithButton
      title="You don't have any chats yet."
      description="You don't have any chats. As soon as you do, they will start to appear here."
      buttonText="New chat"
      onClick={openNewMetricModal}
    />
  );
};

const TitleCell = React.memo<{ title: string; status: VerificationStatus; chatId: string }>(
  ({ title, status, chatId }) => {
    const onFavoriteDivClick = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
    });

    return (
      <div className="flex w-full items-center space-x-2">
        <div className="flex items-center justify-center">
          <StatusBadgeIndicator status={status} />
        </div>
        <Text ellipsis={true}>{title}</Text>
        <div className="flex items-center" onClick={onFavoriteDivClick}>
          <FavoriteStar
            id={chatId}
            type={ShareAssetType.METRIC}
            iconStyle="tertiary"
            title={title}
            className="opacity-0 group-hover:opacity-100"
          />
        </div>
      </div>
    );
  }
);
TitleCell.displayName = 'TitleCell';

const OwnerCell = memo<{ name: string; image: string | null | undefined }>(({ name, image }) => (
  <div className="flex pl-0">
    <BusterUserAvatar image={image || undefined} name={name} size={18} />
  </div>
));
OwnerCell.displayName = 'OwnerCell';
