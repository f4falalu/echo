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
import Link from 'next/link';
import { useHotkeys } from 'react-hotkeys-hook';

export interface DropdownItem<T = string> {
  label: React.ReactNode | string;
  truncate?: boolean;
  searchLabel?: string; // Used for filtering
  secondaryLabel?: string;
  value: T;
  shortcut?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
  items?: DropdownItems<T>;
  link?: string;
  linkIcon?: 'arrow-right' | 'arrow-external' | 'caret-right';
}

export interface DropdownDivider {
  type: 'divider';
}

export type DropdownItems<T = string> = (DropdownItem<T> | DropdownDivider | React.ReactNode)[];

export interface DropdownProps<T> extends DropdownMenuProps {
  items: DropdownItems<T>;
  selectType?: 'single' | 'multiple' | 'none';
  menuHeader?: string | React.ReactNode; //if string it will render a search box
  closeOnSelect?: boolean;
  onSelect?: (value: T) => void;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  emptyStateText?: string;
  className?: string;
  footerContent?: React.ReactNode;
  showIndex?: boolean;
}

const dropdownItemKey = <T,>(item: DropdownItems<T>[number], index: number): string => {
  if ((item as DropdownDivider).type === 'divider') return `divider-${index}`;
  if ((item as DropdownItem<T>).value) return String((item as DropdownItem<T>).value);
  return `item-${index}`;
};

export const _Dropdown = <T,>({
  items,
  selectType = 'none',
  menuHeader,
  closeOnSelect = true,
  onSelect,
  children,
  align = 'center',
  side = 'bottom',
  open,
  onOpenChange,
  emptyStateText = 'No items found',
  className,
  footerContent,
  dir,
  modal,
  showIndex = false
}: DropdownProps<T>) => {
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

  // Keep track of selectable item index
  let hotkeyIndex = -1;

  const dropdownItems = selectType === 'multiple' ? unselectedItems : filteredItems;

  return (
    <DropdownMenu
      open={open}
      defaultOpen={open}
      onOpenChange={onOpenChange}
      dir={dir}
      modal={modal}>
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
              showIndex={showIndex}
            />
            <DropdownMenuSeparator />
          </>
        )}

        <div className="max-h-[375px] overflow-y-auto">
          {hasShownItem ? (
            <>
              {selectedItems.map((item) => {
                // Only increment index for selectable items
                if ((item as DropdownItem).value && !(item as DropdownItem).items) {
                  hotkeyIndex++;
                }

                return (
                  <DropdownItemSelector
                    key={dropdownItemKey(item, hotkeyIndex)}
                    item={item}
                    index={hotkeyIndex}
                    selectType={selectType}
                    onSelect={onSelect}
                    closeOnSelect={closeOnSelect}
                    showIndex={showIndex}
                  />
                );
              })}

              {selectedItems.length > 0 && <DropdownMenuSeparator />}

              {dropdownItems.map((item) => {
                // Only increment index for selectable items
                if ((item as DropdownItem).value && !(item as DropdownItem).items) {
                  hotkeyIndex++;
                }

                return (
                  <DropdownItemSelector
                    item={item as DropdownItems<T>[number]}
                    index={hotkeyIndex}
                    selectType={selectType}
                    onSelect={onSelect}
                    closeOnSelect={closeOnSelect}
                    key={dropdownItemKey(item, hotkeyIndex)}
                    showIndex={showIndex}
                  />
                );
              })}
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
};

export const Dropdown = React.memo(_Dropdown) as typeof _Dropdown;

const DropdownItemSelector = React.memo(
  <T,>({
    item,
    index,
    onSelect,
    closeOnSelect,
    selectType,
    showIndex
  }: {
    item: DropdownItems<T>[number];
    index: number;
    onSelect?: (value: any) => void; // Using any here to resolve the type mismatch
    closeOnSelect: boolean;
    showIndex: boolean;
    selectType: DropdownProps<T>['selectType'];
  }) => {
    if ((item as DropdownDivider).type === 'divider') {
      return <DropdownMenuSeparator />;
    }

    if (typeof item === 'object' && React.isValidElement(item)) {
      return item;
    }

    return (
      <DropdownItem
        {...(item as DropdownItem<T>)}
        closeOnSelect={closeOnSelect}
        onSelect={onSelect}
        selectType={selectType}
        index={index}
        showIndex={showIndex}
      />
    );
  }
);

const DropdownItem = <T,>({
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
}: DropdownItem<T> & {
  onSelect?: (value: T) => void;
  closeOnSelect: boolean;
  index: number;
  showIndex: boolean;
  selectType: DropdownProps<T>['selectType'];
}) => {
  const onClickItem = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) onClick();
    if (onSelect) onSelect(value as T);
  });

  // Add hotkey support when showIndex is true
  useHotkeys(
    showIndex ? `${index}` : '',
    (e) => {
      e.preventDefault();
      if (!disabled) {
        onClickItem(e as unknown as React.MouseEvent<HTMLDivElement>);
        // Close the dropdown if closeOnSelect is true
        if (closeOnSelect) {
          const dropdownTrigger = document.querySelector('[data-state="open"][role="menu"]');
          if (dropdownTrigger) {
            const closeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            dropdownTrigger.dispatchEvent(closeEvent);
          }
        }
      }
    },
    { enabled: showIndex && !disabled }
  );

  const isSubItem = items && items.length > 0;
  const isSelectable = !!selectType && selectType !== 'none';

  // Helper function to render the content consistently with proper type safety
  const renderContent = () => {
    const content = (
      <>
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
            link={isSelectable ? link : null}
            linkIcon={linkIcon}
          />
        )}
      </>
    );

    // Wrap with Link if needed
    if (!isSelectable && link) {
      return (
        <Link className="flex w-full items-center gap-x-2" href={link}>
          {content}
        </Link>
      );
    }

    return content;
  };

  if (isSubItem) {
    return (
      <DropdownSubMenuWrapper
        items={items}
        closeOnSelect={closeOnSelect}
        onSelect={onSelect}
        showIndex={showIndex}
        selectType={selectType}>
        {renderContent()}
      </DropdownSubMenuWrapper>
    );
  }

  if (selectType === 'single') {
    return (
      <DropdownMenuCheckboxItemSingle
        checked={selected}
        disabled={disabled}
        onClick={onClickItem}
        index={showIndex ? index : undefined}
        closeOnSelect={closeOnSelect}>
        {renderContent()}
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
        {renderContent()}
      </DropdownMenuCheckboxItemMultiple>
    );
  }

  return (
    <DropdownMenuItem
      truncate={truncate}
      disabled={disabled}
      onClick={onClickItem}
      closeOnSelect={closeOnSelect}>
      {renderContent()}
    </DropdownMenuItem>
  );
};

interface DropdownSubMenuWrapperProps<T> {
  items: DropdownItems<T> | undefined;
  children: React.ReactNode;
  closeOnSelect: boolean;
  showIndex: boolean;
  onSelect?: (value: T) => void;
  selectType: DropdownProps<T>['selectType'];
}

const DropdownSubMenuWrapper = <T,>({
  items,
  children,
  closeOnSelect,
  onSelect,
  selectType,
  showIndex
}: DropdownSubMenuWrapperProps<T>) => {
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
              showIndex={showIndex}
            />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};

const DropdownMenuHeaderSelector = React.memo(
  <T,>({
    menuHeader,
    onChange,
    text,
    showIndex
  }: {
    menuHeader: NonNullable<DropdownProps<T>['menuHeader']>;
    onChange: (text: string) => void;
    text: string;
    showIndex: boolean;
  }) => {
    if (typeof menuHeader === 'string') {
      return (
        <DropdownMenuHeaderSearch
          showIndex={showIndex}
          placeholder={menuHeader}
          onChange={onChange}
          text={text}
        />
      );
    }
    return menuHeader;
  }
);

DropdownMenuHeaderSelector.displayName = 'DropdownMenuHeaderSelector';

interface DropdownMenuHeaderSearchProps {
  text: string;
  onChange: (text: string) => void;
  placeholder?: string;
  showIndex: boolean;
}

const DropdownMenuHeaderSearch = React.memo(
  ({ text, onChange, showIndex, placeholder }: DropdownMenuHeaderSearchProps) => {
    const onChangePreflight = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      e.preventDefault();
      onChange(e.target.value);
    });

    const onKeyDownPreflight = useMemoizedFn((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (showIndex && !isNaN(Number(e.currentTarget.value))) {
        const isCurrentValueNumber = e.code.includes('Digit');
        if (isCurrentValueNumber) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    });

    return (
      <div className="flex items-center gap-x-2">
        <Input
          autoFocus
          variant={'ghost'}
          placeholder={placeholder}
          value={text}
          onChange={onChangePreflight}
          onKeyDown={onKeyDownPreflight}
        />
      </div>
    );
  }
);

DropdownMenuHeaderSearch.displayName = 'DropdownMenuHeaderSearch';
