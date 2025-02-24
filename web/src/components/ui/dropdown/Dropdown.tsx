import { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import React from 'react';
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
  DropdownMenuTrigger
} from './DropdownBase';
import { useMemoizedFn } from 'ahooks';

export interface DropdownItem {
  label: React.ReactNode;
  id: string;
  index?: number;
  shortcut?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  link?: string;
  loading?: boolean;
  selected?: boolean;
  items?: (DropdownItem | DropdownDivider)[];
}

export interface DropdownDivider {
  type: 'divider';
}

export type DropdownItems = (DropdownItem | DropdownDivider)[];

export interface DropdownProps extends DropdownMenuProps {
  items?: DropdownItems;
  selectType?: 'default' | 'single' | 'multiple';
  menuLabel?: string | React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  closeOnSelect?: boolean;
  onSelect?: (itemId: string) => void;
}

const dropdownItemKey = (item: DropdownItem | DropdownDivider, index: number) => {
  if ((item as DropdownDivider).type === 'divider') return `divider-${index}`;
  return (item as DropdownItem).id;
};

export const Dropdown: React.FC<DropdownProps> = React.memo(
  ({
    items = [],
    selectType = 'default',
    menuLabel,
    minWidth = 200,
    maxWidth,
    closeOnSelect = true,
    onSelect,
    children,
    ...props
  }) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {menuLabel && (
            <>
              <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}

          {items.map((item, index) => (
            <DropdownItemSelector item={item} index={index} onSelect={onSelect} />
          ))}
          {/*
 
   

          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Users />
              <span>Team</span>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <UserPlus />
                <span>Invite users</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>
                    <Mail />
                    <span>Email</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageSquare />
                    <span>Message</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <PlusCircle />
                    <span>More...</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem>
              <Plus />
              <span>New Team</span>
              <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Github />
            <span>GitHub</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LifeBuoy />
            <span>Support</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Cloud />
            <span>API</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut />
            <span>Log out</span>
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

const DropdownItemSelector: React.FC<{
  item: DropdownItem | DropdownDivider;
  index: number;
  onSelect: DropdownProps['onSelect'];
}> = React.memo(({ item, index, onSelect }) => {
  const isDivider = (item as DropdownDivider).type === 'divider';
  const id = dropdownItemKey(item, index);
  return (
    <React.Fragment key={id}>
      {isDivider ? (
        <DropdownMenuSeparator />
      ) : (
        <DropdownItem {...(item as DropdownItem)} onSelect={onSelect} />
      )}
    </React.Fragment>
  );
});

DropdownItemSelector.displayName = 'DropdownItemSelector';

const DropdownItem = ({
  label,
  id,
  index,
  shortcut,
  onClick,
  icon,
  disabled,
  link,
  loading,
  selected,
  items,
  onSelect
}: DropdownItem & {
  onSelect: DropdownProps['onSelect'];
}) => {
  const onClickItem = useMemoizedFn(() => {
    if (onClick) onClick();
    if (onSelect) onSelect(id);
  });
  const isSubItem = items && items.length > 0;
  const Wrapper = isSubItem ? DropdownSubMenuWrapper : React.Fragment;

  return (
    <DropdownMenuItem onClick={onClickItem}>
      <Wrapper items={items} onSelect={onSelect}>
        {icon && <span className="text-icon-color">{icon}</span>}
        {label}
        {shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
      </Wrapper>
    </DropdownMenuItem>
  );
};

const DropdownSubMenuWrapper = React.memo(
  ({
    items,
    children,
    onSelect
  }: {
    items: DropdownItems;
    children: React.ReactNode;
    onSelect: DropdownProps['onSelect'];
  }) => {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger> {children}</DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            {items.map((item, index) => (
              <DropdownItemSelector item={item} index={index} onSelect={onSelect} />
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    );
  }
);
