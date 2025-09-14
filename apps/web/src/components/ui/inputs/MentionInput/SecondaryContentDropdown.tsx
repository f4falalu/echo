import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../../buttons';
import { Dropdown, type IDropdownItems } from '../../dropdown';
import { Dots } from '../../icons';

interface SecondaryContentDropdownProps {
  items: IDropdownItems;
}

export const SecondaryContentDropdown = ({ items }: SecondaryContentDropdownProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Dropdown open={open} onOpenChange={setOpen} items={items}>
      <Button
        variant={'ghost'}
        className={cn(
          //group-hover/mention-list-item:flex
          'hover:bg-item-active hidden  group-data-[selected=true]/mention-list-item:flex -mr-1.5',
          open && 'flex!'
        )}
        prefix={<Dots />}
      />
    </Dropdown>
  );
};
