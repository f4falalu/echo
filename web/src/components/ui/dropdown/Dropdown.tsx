import { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import React, { useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup, //Do I need this?
  DropdownMenuLabel, //Do I need this?
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItemSingle,
  DropdownMenuCheckboxItemMultiple,
  DropdownMenuLink
} from './DropdownBase';
import { CircleSpinnerLoader } from '../loaders/CircleSpinnerLoader';
import { useMemoizedFn } from 'ahooks';
import { cn } from '@/lib/classMerge';
import { Input } from '../inputs/Input';
import { useDebounceSearch } from '@/hooks';

export interface DropdownItem {
  label: React.ReactNode | string;
  truncate?: boolean;
  searchLabel?: string; // Used for filtering
  secondaryLabel?: string;
  value: string;
  showIndex?: boolean;
  shortcut?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
  items?: DropdownItems;
  link?: string;
  linkIcon?: 'arrow-right' | 'arrow-external' | 'caret-right';
}

export interface DropdownDivider {
  type: 'divider';
}

export type DropdownItems = (DropdownItem | DropdownDivider | React.ReactNode)[];

export interface DropdownProps extends DropdownMenuProps {
  items: DropdownItems;
  selectType?: 'single' | 'multiple' | 'none';
  menuHeader?: string | React.ReactNode; //if string it will render a search box
  closeOnSelect?: boolean;
  onSelect?: (itemId: string) => void;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  emptyStateText?: string;
  className?: string;
  footerContent?: React.ReactNode;
}

const dropdownItemKey = (item: DropdownItems[number], index: number) => {
  if ((item as DropdownDivider).type === 'divider') return `divider-${index}`;
  if ((item as DropdownItem).value) return (item as DropdownItem).value;
  return `item-${index}`;
};

export const Dropdown: React.FC<DropdownProps> = React.memo(
  ({
    items = [],
    selectType = 'none',
    menuHeader,
    closeOnSelect = true,
    onSelect,
    children,
    align = 'center',
    side = 'bottom',
    open,
    defaultOpen,
    onOpenChange,
    emptyStateText = 'No items found',
    className,
    footerContent,
    ...props
  }) => {
    const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
      items,
      searchPredicate: (item, searchText) => {
        if ((item as DropdownItem).value) {
          const _item = item as DropdownItem;
          const searchContent =
            _item.searchLabel || (typeof _item.label === 'string' ? _item.label : '');
          return searchContent?.toLowerCase().includes(searchText.toLowerCase());
        }
        return true;
      },
      debounceTime: 50
    });

    const hasShownItem = useMemo(() => {
      return filteredItems.length > 0 && filteredItems.some((item) => (item as DropdownItem).value);
    }, [filteredItems]);

    const { selectedItems, unselectedItems } = useMemo(() => {
      if (selectType === 'multiple') {
        const [selectedItems, unselectedItems] = filteredItems.reduce(
          (acc, item) => {
            if ((item as DropdownItem).selected) {
              acc[0].push(item);
            } else {
              acc[1].push(item);
            }
            return acc;
          },
          [[], []] as [typeof filteredItems, typeof filteredItems]
        );
        return { selectedItems, unselectedItems };
      }
      return {
        selectedItems: [],
        unselectedItems: []
      };
    }, [selectType, filteredItems]);

    const dropdownItems = selectType === 'multiple' ? unselectedItems : filteredItems;

    return (
      <DropdownMenu open={open} defaultOpen={open} onOpenChange={onOpenChange} {...props}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn('max-w-72 min-w-44', className)}
          align={align}
          side={side}
          footerContent={footerContent}>
          {menuHeader && (
            <>
              <DropdownMenuHeaderSelector
                menuHeader={menuHeader}
                onChange={handleSearchChange}
                text={searchText}
              />
              <DropdownMenuSeparator />
            </>
          )}

          <div className="max-h-[350px] overflow-y-auto">
            {hasShownItem ? (
              <>
                {selectedItems.map((item, index) => (
                  <DropdownItemSelector
                    item={item}
                    index={index}
                    selectType={selectType}
                    onSelect={onSelect}
                    closeOnSelect={closeOnSelect}
                    key={dropdownItemKey(item, index)}
                  />
                ))}

                {selectedItems.length > 0 && <DropdownMenuSeparator />}

                {dropdownItems.map((item, index) => (
                  <DropdownItemSelector
                    item={item}
                    index={index}
                    selectType={selectType}
                    onSelect={onSelect}
                    closeOnSelect={closeOnSelect}
                    key={dropdownItemKey(item, index)}
                  />
                ))}
              </>
            ) : (
              <DropdownMenuItem disabled className="text-gray-light text-center">
                {emptyStateText}
              </DropdownMenuItem>
            )}
          </div>
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
  selectType: DropdownProps['selectType'];
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

const DropdownItem: React.FC<
  DropdownItem & {
    onSelect: DropdownProps['onSelect'];
    closeOnSelect: boolean;
    index: number;
    selectType: DropdownProps['selectType'];
  }
> = ({
  label,
  value,
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
  selectType,
  secondaryLabel,
  truncate,
  link,
  linkIcon
}) => {
  const onClickItem = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) onClick();
    if (onSelect) onSelect(value);
  });

  const isSubItem = items && items.length > 0;

  const content = (
    <>
      {showIndex && <span className="text-gray-light">{index}</span>}
      {icon && !loading && <span className="text-icon-color">{icon}</span>}
      {loading && <CircleSpinnerLoader size={9} />}
      <div className={cn('flex flex-col gap-y-1', truncate && 'overflow-hidden')}>
        <span className={cn(truncate && 'truncate')}>{label}</span>
        {secondaryLabel && <span className="text-gray-light text2xs">{secondaryLabel}</span>}
      </div>
      {shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
      {link && (
        <DropdownMenuLink
          className="-mr-1 ml-auto opacity-0 group-hover:opacity-50 hover:opacity-100"
          link={link}
          linkIcon={linkIcon}
        />
      )}
    </>
  );

  if (isSubItem) {
    return (
      <DropdownSubMenuWrapper
        items={items}
        closeOnSelect={closeOnSelect}
        onSelect={onSelect}
        selectType={selectType}>
        {content}
      </DropdownSubMenuWrapper>
    );
  }

  if (selectType === 'single') {
    return (
      <DropdownMenuCheckboxItemSingle
        checked={selected}
        disabled={disabled}
        onClick={onClickItem}
        closeOnSelect={closeOnSelect}>
        {content}
      </DropdownMenuCheckboxItemSingle>
    );
  }

  if (selectType === 'multiple') {
    return (
      <DropdownMenuCheckboxItemMultiple
        checked={selected}
        disabled={disabled}
        onClick={onClickItem}
        closeOnSelect={closeOnSelect}>
        {content}
      </DropdownMenuCheckboxItemMultiple>
    );
  }

  return (
    <DropdownMenuItem
      truncate={truncate}
      disabled={disabled}
      onClick={onClickItem}
      closeOnSelect={closeOnSelect}>
      {content}
    </DropdownMenuItem>
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
    selectType: DropdownProps['selectType'];
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

const DropdownMenuHeaderSelector: React.FC<{
  menuHeader: NonNullable<DropdownProps['menuHeader']>;
  onChange: (text: string) => void;
  text: string;
}> = React.memo(({ menuHeader, onChange, text }) => {
  // if (typeof menuHeader === 'string') {
  //   return <DropdownMenuLabel>{menuHeader}</DropdownMenuLabel>;
  // }
  if (typeof menuHeader === 'string') {
    return <DropdownMenuHeaderSearch placeholder={menuHeader} onChange={onChange} text={text} />;
  }
  return menuHeader;
});

DropdownMenuHeaderSelector.displayName = 'DropdownMenuHeaderSelector';

interface DropdownMenuHeaderSearchProps {
  text: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

const DropdownMenuHeaderSearch: React.FC<DropdownMenuHeaderSearchProps> = React.memo(
  ({ text, onChange, placeholder }) => {
    return (
      <div className="flex items-center gap-x-2">
        <Input
          autoFocus
          variant={'ghost'}
          placeholder={placeholder}
          value={text}
          onChange={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onChange(e.target.value);
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
        />
        {/* 
      <div className="flex pr-1 opacity-20 hover:opacity-100">
        <Button
          className="cursor-pointer"
          onClick={() => onChange('')}
          prefix={<CircleXmark />}
          variant={'link'}
          size={'small'}></Button>
      </div> */}
      </div>
    );
  }
);

DropdownMenuHeaderSearch.displayName = 'DropdownMenuHeaderSearch';
