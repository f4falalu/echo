import { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import React, { useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup, //Do I need this?
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem
} from './DropdownBase';
import { CircleSpinnerLoader } from '../loaders/CircleSpinnerLoader';
import { useMemoizedFn } from 'ahooks';
import { cn } from '@/lib/classMerge';

export interface DropdownItem {
  label: React.ReactNode;
  id: string;
  showIndex?: boolean;
  shortcut?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
  items?: DropdownItems;
}

export interface DropdownDivider {
  type: 'divider';
}

export type DropdownItems = (DropdownItem | DropdownDivider | React.ReactNode)[];

export interface DropdownProps extends DropdownMenuProps {
  items?: DropdownItems;
  selectType?: 'default' | 'single' | 'multiple';
  menuLabel?: string | React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  closeOnSelect?: boolean;
  onSelect?: (itemId: string) => void;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  contentClassName?: string;
}

const dropdownItemKey = (item: DropdownItems[number], index: number) => {
  if ((item as DropdownDivider).type === 'divider') return `divider-${index}`;
  if ((item as DropdownItem).id) return (item as DropdownItem).id;
  return `item-${index}`;
};

export const Dropdown: React.FC<DropdownProps> = React.memo(
  ({
    items = [],
    selectType = 'default',
    menuLabel,
    minWidth = 240,
    maxWidth,
    closeOnSelect = true,
    onSelect,
    children,
    align = 'center',
    side = 'bottom',
    contentClassName,
    open,
    defaultOpen,
    onOpenChange,
    ...props
  }) => {
    return (
      <DropdownMenu open={open} defaultOpen={open} onOpenChange={onOpenChange} {...props}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent className={cn('w-56', contentClassName)} align={align} side={side}>
          {menuLabel && (
            <>
              <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}

          {items.map((item, index) => (
            <DropdownItemSelector
              item={item}
              index={index}
              selectType={selectType}
              onSelect={onSelect}
              closeOnSelect={closeOnSelect}
              key={dropdownItemKey(item, index)}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

Dropdown.displayName = 'Dropdown';

const DropdownItemSelector: React.FC<{
  item: DropdownItems[number];
  index: number;
  onSelect: DropdownProps['onSelect'];
  closeOnSelect: boolean;
  selectType: NonNullable<DropdownProps['selectType']>;
}> = React.memo(({ item, index, onSelect, closeOnSelect, selectType }) => {
  if ((item as DropdownDivider).type === 'divider') {
    return <DropdownMenuSeparator />;
  }

  if (typeof item === 'object' && React.isValidElement(item)) {
    return item;
  }

  return (
    <DropdownItem
      {...(item as DropdownItem)}
      closeOnSelect={closeOnSelect}
      onSelect={onSelect}
      selectType={selectType}
      index={index}
    />
  );
});

DropdownItemSelector.displayName = 'DropdownItemSelector';

const DropdownItem = ({
  label,
  id,
  showIndex,
  shortcut,
  onClick,
  icon,
  disabled,
  loading,
  selected,
  index,
  items,
  closeOnSelect,
  onSelect,
  selectType
}: DropdownItem & {
  onSelect: DropdownProps['onSelect'];
  closeOnSelect: boolean;
  index: number;
  selectType: NonNullable<DropdownProps['selectType']>;
}) => {
  const onClickItem = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) onClick();
    if (onSelect) onSelect(id);
  });

  const isSubItem = items && items.length > 0;

  const Wrapper = useMemo(() => {
    if (isSubItem) return DropdownSubMenuWrapper;
    if (selectType === 'multiple' || selectType === 'single') return DropdownMenuCheckboxItem;
    return DropdownMenuItem;
  }, [isSubItem, selectType]);

  return (
    <Wrapper
      items={items}
      disabled={disabled}
      checked={selected}
      onClick={onClickItem}
      closeOnSelect={closeOnSelect}
      selectType={selectType}>
      {showIndex && <span className="text-gray-light">{index}</span>}
      {icon && !loading && <span className="text-icon-color">{icon}</span>}
      {loading && <CircleSpinnerLoader size={9} />}
      {label}
      {shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
    </Wrapper>
  );
};

const DropdownSubMenuWrapper = React.memo(
  ({
    items,
    children,
    closeOnSelect,
    onSelect,
    selectType
  }: {
    items: DropdownItems | undefined;
    children: React.ReactNode;
    closeOnSelect: boolean;
    onSelect?: DropdownProps['onSelect'];
    selectType: NonNullable<DropdownProps['selectType']>;
  }) => {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>{children}</DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            {items?.map((item, index) => (
              <DropdownItemSelector
                key={dropdownItemKey(item, index)}
                item={item}
                index={index}
                onSelect={onSelect}
                closeOnSelect={closeOnSelect}
                selectType={selectType}
              />
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    );
  }
);
DropdownSubMenuWrapper.displayName = 'DropdownSubMenuWrapper';
