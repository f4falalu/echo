import React, { useMemo } from 'react';
import { Button } from '@/components/ui/buttons';
import type { BusterApiKeyListItem } from '@/api/asset_interfaces';

import { formatDate } from '@/lib/date';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { Trash } from '@/components/ui/icons';

interface ApiKeyListItemProps {
  apiKey: BusterApiKeyListItem;
  onDelete: (id: string) => void;
}

export const ApiKeyListItem: React.FC<ApiKeyListItemProps> = ({ apiKey, onDelete }) => {
  const date = useMemo(
    () => formatDate({ date: apiKey.created_at, format: 'LLL' }),
    [apiKey.created_at]
  );

  const handleDelete = useMemoizedFn(() => {
    onDelete(apiKey.id);
  });

  return (
    <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3 transition-shadow hover:shadow-xs">
      <div className="flex flex-col">
        <Text>{apiKey.owner_email}</Text>
        <div className="flex items-center gap-1">
          <Text variant="secondary" size="sm">
            {`Created at: ${date}`}
          </Text>
        </div>
      </div>
      <Button variant="danger" prefix={<Trash />} onClick={handleDelete}>
        Delete
      </Button>
    </div>
  );
};
