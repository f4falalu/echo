import React, { useMemo } from 'react';
import type { ShareAssetType, ShareRole } from '@buster/server-shared/share';
import type { DropdownItem } from '@/components/ui/dropdown';
import { Dropdown } from '@/components/ui/dropdown';
import { ChevronDown } from '@/components/ui/icons/NucleoIconFilled';
import { Paragraph, Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';

type DropdownValue = ShareRole | 'remove' | 'notShared';

export const AccessDropdown: React.FC<{
  className?: string;
  showRemove?: boolean;
  shareLevel?: ShareRole | null;
  onChangeShareLevel?: (level: ShareRole | null) => void;
  assetType: ShareAssetType;
  disabled: boolean;
}> = ({
  shareLevel,
  showRemove = true,
  disabled,
  className = '',
  onChangeShareLevel,
  assetType
}) => {
  const items = useMemo(() => {
    const baseItems: DropdownItem<DropdownValue>[] = [...(itemsRecord[assetType] || [])];

    if (showRemove) {
      baseItems.push({
        label: 'Remove',
        value: 'remove'
      });
    }

    return baseItems.map((item) => ({
      ...item,
      selected: item.value === shareLevel
    }));
  }, [showRemove, shareLevel, assetType]);

  const selectedLabel = useMemo(() => {
    const selectedItem = items.find((item) => item.selected) || OWNER_ITEM;

    const { value } = selectedItem;

    // Using a type-safe switch to handle all ShareRole values
    switch (value) {
      case 'fullAccess':
        return 'Full access';
      case 'canEdit':
        return 'Can edit';
      case 'canFilter':
        return 'Can filter';
      case 'canView':
        return 'Can view';
      case 'owner':
        return 'Owner';
      case 'remove':
        return 'Remove';
      case 'notShared':
        return 'Not shared';
    }
  }, [items]);

  const onSelectMenuItem = useMemoizedFn((value: string) => {
    if (value === 'remove' || value === 'notShared') {
      onChangeShareLevel?.(null);
    } else {
      onChangeShareLevel?.(value as ShareRole);
    }
  });

  return (
    <Dropdown
      items={items}
      disabled={disabled}
      footerContent={<FooterContent />}
      footerClassName="p-0!"
      onSelect={onSelectMenuItem}
      sideOffset={16}
      selectType="single"
      align="end"
      side="bottom">
      <Text
        dataTestId={`share-role-${shareLevel}`}
        variant="secondary"
        size="xs"
        className={cn('flex! items-center! space-x-1', !disabled && 'cursor-pointer', className)}>
        <span className="truncate">{selectedLabel}</span>
        {!disabled && (
          <span className="text-2xs text-icon-color">
            <ChevronDown />
          </span>
        )}
      </Text>
    </Dropdown>
  );
};

const metricItems: DropdownItem<ShareRole>[] = [
  {
    value: 'fullAccess',
    label: 'Full access',
    secondaryLabel: 'Can edit and share with others.'
  },
  {
    value: 'canEdit',
    label: 'Can edit',
    secondaryLabel: 'Can edit but not share with others.'
  },
  {
    value: 'canView',
    label: 'Can view',
    secondaryLabel: 'Can view asset but not edit.'
  }
];

const dashboardItems: DropdownItem<ShareRole>[] = [
  {
    value: 'fullAccess',
    label: 'Full access',
    secondaryLabel: 'Can edit and share with others.'
  },
  {
    value: 'canEdit',
    label: 'Can edit',
    secondaryLabel: 'Can edit but not share with others.'
  },
  {
    value: 'canFilter',
    label: 'Can filter',
    secondaryLabel: 'Can filter dashboards but not edit.'
  },
  {
    value: 'canView',
    label: 'Can view',
    secondaryLabel: 'Can view dashboard and metrics but not edit.'
  }
];

const collectionItems: DropdownItem<ShareRole>[] = [
  {
    value: 'fullAccess',
    label: 'Full access',
    secondaryLabel: 'Can edit and share with others.'
  },
  {
    value: 'canEdit',
    label: 'Can edit',
    secondaryLabel: 'Can edit but not share with others.'
  },
  {
    value: 'canView',
    label: 'Can view',
    secondaryLabel: 'Can view assets but not edit.'
  }
];

const itemsRecord: Record<ShareAssetType, DropdownItem<ShareRole>[]> = {
  ['dashboard']: dashboardItems,
  ['metric']: metricItems,
  ['collection']: collectionItems,
  ['chat']: collectionItems
};

const OWNER_ITEM: DropdownItem<DropdownValue> = {
  value: 'owner',
  label: 'Owner',
  secondaryLabel: 'Owner of the asset.'
};

const FooterContent = React.memo(() => {
  return (
    <div className="bg-item-hover flex justify-center overflow-hidden rounded-b p-2 px-2.5">
      <Paragraph variant="secondary" size="xs">
        Sharing cannot override permissions set by your account admins.
      </Paragraph>
    </div>
  );
});
FooterContent.displayName = 'FooterContent';
