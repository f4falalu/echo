'use client';

import {
  ShareAssetType,
  VerificationStatus,
  type BusterChatListItem
} from '@/api/asset_interfaces';
import { makeHumanReadble, formatDate } from '@/lib';
import React, { memo, useMemo, useRef, useState } from 'react';
import { FavoriteStar, getShareStatus } from '@/components/features/list';
import { Text } from '@/components/ui';
import { Avatar } from '@/components/ui/avatar';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useMemoizedFn } from 'ahooks';
import { BusterListColumn, BusterListRow } from '@/components/ui/list';
import { ChatSelectedOptionPopup } from './ChatItemsSelectedPopup';
import { BusterList, ListEmptyStateWithButton } from '@/components/ui/list';
import { useCreateListByDate } from '@/components/ui/list/useCreateListByDate';

export const ChatItemsContainer: React.FC<{
  chats: BusterChatListItem[];
  className?: string;
  loading: boolean;
}> = ({ chats = [], className = '', loading }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const renderedDates = useRef<Record<string, string>>({});
  const renderedOwners = useRef<Record<string, React.ReactNode>>({});

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
    <>
      <BusterList
        rows={chatsByDate}
        columns={columns}
        onSelectChange={onSelectChange}
        selectedRowKeys={selectedRowKeys}
        emptyState={<EmptyState loading={loading} />}
      />

      <ChatSelectedOptionPopup
        selectedRowKeys={selectedRowKeys}
        onSelectChange={onSelectChange}
        hasSelected={hasSelected}
      />
    </>
  );
};

const EmptyState: React.FC<{
  loading: boolean;
}> = React.memo(({ loading }) => {
  if (loading) return <></>;

  return (
    <ListEmptyStateWithButton
      title="You don't have any chats yet."
      description="You don't have any chats. As soon as you do, they will start to appear here."
      buttonText="New chat"
      linkButton={createBusterRoute({ route: BusterRoutes.APP_HOME })}
    />
  );
});
EmptyState.displayName = 'EmptyState';

const TitleCell = React.memo<{ title: string; status: VerificationStatus; chatId: string }>(
  ({ title, status, chatId }) => {
    const onFavoriteDivClick = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
    });

    return (
      <div className="flex w-full items-center space-x-2">
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

const OwnerCell = memo<{ name: string; image: string | undefined }>(({ name, image }) => (
  <div className="flex pl-0">
    <Avatar image={image} name={name} className="h-[18px] w-[18px]" />
  </div>
));
OwnerCell.displayName = 'OwnerCell';
