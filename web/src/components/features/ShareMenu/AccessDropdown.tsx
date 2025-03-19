import React, { useMemo } from 'react';
import { ShareRole } from '@/api/asset_interfaces';
import { DropdownItem, DropdownLabel } from '@/components/ui/dropdown';
import { Paragraph, Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { Dropdown } from '@/components/ui/dropdown';
import { ChevronDown } from '@/components/ui/icons/NucleoIconFilled';
import { canEdit } from '@/lib/share';

type DropdownValue = ShareRole | 'remove' | 'notShared';

export const AccessDropdown: React.FC<{
  groupShare?: boolean;
  className?: string;
  showRemove?: boolean;
  shareLevel?: ShareRole | null;
  onChangeShareLevel?: (level: ShareRole | null) => void;
}> = ({
  shareLevel,
  showRemove = true,
  groupShare = false,
  className = '',
  onChangeShareLevel
}) => {
  const disabled = useMemo(() => canEdit(shareLevel), [shareLevel]);

  const items = useMemo(() => {
    const baseItems: DropdownItem<DropdownValue>[] = [...standardItems];

    if (groupShare) {
      baseItems.push({
        label: <DropdownLabel title="Not shared" subtitle="Does not have access." />,
        value: 'notShared'
      });
    } else if (showRemove) {
      baseItems.push({
        label: 'Remove',
        value: 'remove'
      });
    }

    return baseItems.map((item) => ({
      ...item,
      selected: item.value === shareLevel
    }));
  }, [groupShare, showRemove, shareLevel]);

  const selectedLabel = useMemo(() => {
    const selectedItem = items.find((item) => item.selected);
    if (!selectedItem) return 'No shared';

    const { value } = selectedItem;

    // Using a type-safe switch to handle all ShareRole values
    switch (value) {
      case ShareRole.FULL_ACCESS:
        return 'Full access';
      case ShareRole.CAN_EDIT:
        return 'Can edit';
      case ShareRole.CAN_FILTER:
        return 'Can filter';
      case ShareRole.CAN_VIEW:
        return 'Can view';
      case ShareRole.OWNER:
        return 'Full access';
      case 'remove':
        return 'Remove';
      case 'notShared':
        return 'Not shared';
      default:
        return typeof selectedItem.label === 'string' ? selectedItem.label : 'Selected';
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
      footerContent={<FooterContent />}
      footerClassName="p-0!"
      onSelect={onSelectMenuItem}
      sideOffset={16}
      selectType="single"
      align="end"
      side="bottom">
      <Text
        variant="secondary"
        size="xs"
        className={`flex! cursor-pointer items-center! space-x-1 ${className}`}>
        <span className="truncate">{selectedLabel}</span>
        <span className="text-2xs">{!disabled && <ChevronDown />}</span>
      </Text>
    </Dropdown>
  );
};

const standardItems: DropdownItem<ShareRole>[] = [
  {
    value: ShareRole.FULL_ACCESS,
    label: 'Full access',
    secondaryLabel: 'Can edit and share with others.'
  },
  {
    value: ShareRole.CAN_EDIT,
    label: 'Can edit',
    secondaryLabel: 'Can edit but not share with others.'
  },
  {
    value: ShareRole.CAN_FILTER,
    label: 'Can filter',
    secondaryLabel: 'Can filter dashboards but not edit.'
  },
  {
    value: ShareRole.CAN_VIEW,
    label: 'Can view',
    secondaryLabel: 'Can view asset but not edit.'
  }
];

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
