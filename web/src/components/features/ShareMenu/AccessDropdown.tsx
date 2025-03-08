import React, { useMemo } from 'react';
import { ShareRole } from '@/api/asset_interfaces';
import { DropdownItem, DropdownItems, DropdownLabel } from '@/components/ui/dropdown';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { Separator } from '@/components/ui/seperator';
import { ArrowDown } from '@/components/ui/icons';
import { Dropdown } from '@/components/ui/dropdown';

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
  const disabled = useMemo(() => {
    return shareLevel === ShareRole.OWNER;
  }, [shareLevel]);

  const items: DropdownItem<string>[] = useMemo(() => {
    // groupShare
    // ? [
    //     ...standardItems,
    //     {
    //       label: <DropdownLabel title="Not shared" subtitle="Does not have access." />,
    //       key: 'notShared'
    //     }
    //   ]
    // : ([
    //     ...standardItems,
    //     showRemove && {
    //       label: 'Remove',
    //       key: 'remove'
    //     }
    //   ].filter(Boolean) as {
    //     label: string | React.ReactNode;
    //     key: string;
    //   }[])

    if (groupShare) {
      return [
        ...standardItems
        // {
        //   label: <DropdownLabel title="Not shared" subtitle="Does not have access." />,
        //   value: 'notShared'
        // }
      ];
    }

    return [];
  }, [groupShare, standardItems, showRemove]);

  const selectedItem: DropdownItem | undefined = useMemo(
    () =>
      groupShare && !shareLevel
        ? items.find((v) => v.value === 'notShared')!
        : items.find((v) => v.value === shareLevel) || items[items.length - 1],
    [groupShare, shareLevel, items]
  );

  const selectedLabel = useMemo(() => {
    if (!selectedItem) return 'No shared';
    if (selectedItem.value === ShareRole.OWNER) return 'Full access';
    if (selectedItem.value === ShareRole.EDITOR) return 'Can edit';
    if (selectedItem.value === ShareRole.VIEWER) return 'Can view';
    if (selectedItem.value === 'remove') return 'Remove';
    if (selectedItem.value === 'notShared') return 'Not shared';
    return selectedItem.label;
  }, [selectedItem, items]);

  const onSelectMenuItem = useMemoizedFn(({ key }: { key: string }) => {
    if (key === 'remove' || key === 'notShared') {
      onChangeShareLevel?.(null);
    } else {
      onChangeShareLevel?.(key as ShareRole);
    }
  });

  const dropdownRender = useMemoizedFn((menu: React.ReactNode) => {
    return (
      <div className="bg-gray-light max-w-[235px] rounded shadow">
        {React.cloneElement(menu as React.ReactElement<any>, {
          style: {
            boxShadow: 'none'
          }
        })}
        <Separator />
        <div className="bg-item-hover flex justify-center overflow-hidden rounded-b p-2 px-2.5">
          <Text variant="secondary" size="xs">
            Sharing cannot override permissions set by your account admins.
          </Text>
        </div>
      </div>
    );
  });

  // const memoizedMenu: MenuProps = useMemo(() => {
  //   return {
  //     items,
  //     selectable: true,
  //     defaultSelectedKeys: [items[0]?.key as string],
  //     selectedKeys: [selectedItem.key as string],
  //     onSelect: onSelectMenuItem
  //   };
  // }, [items, onSelectMenuItem, selectedItem]);

  return (
    <Dropdown items={items} selectType="single" align="end" side="bottom">
      <Text
        variant="secondary"
        size="xs"
        className={`flex! cursor-pointer items-center! space-x-1 ${className}`}>
        <div>{selectedLabel}</div>
        {!disabled && <ArrowDown />}
      </Text>
    </Dropdown>
  );
};

const standardItems: DropdownItem<ShareRole>[] = [
  {
    label: <DropdownLabel title="Full access" subtitle="Can edit and share with others." />,
    value: ShareRole.OWNER
  },
  {
    label: <DropdownLabel title="Can edit" subtitle="Can edit but not share with others." />,
    value: ShareRole.EDITOR
  },
  {
    label: <DropdownLabel title="Can view" subtitle="Can view but not edit." />,
    value: ShareRole.VIEWER
  }
];
