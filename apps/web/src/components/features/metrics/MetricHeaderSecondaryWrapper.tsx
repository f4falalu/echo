import { useState } from 'react';
import { Button } from '@/components/ui/buttons/Button';
import { Dropdown, type IDropdownItems } from '@/components/ui/dropdown';
import { DotsVertical } from '@/components/ui/icons';
import { cn } from '@/lib/classMerge';

export const MetricHeaderSecondaryWrapperDropdown = ({
  dropdownItems,
}: {
  dropdownItems: IDropdownItems;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      className={cn(
        'mt-1.5 mr-1.5 opacity-0 group-hover:opacity-100',
        'group-hover:pointer-events-auto',
        isOpen && 'pointer-events-auto block opacity-100'
      )}
    >
      <Dropdown
        items={dropdownItems}
        onOpenChange={setIsOpen}
        side="left"
        align="start"
        contentClassName="max-h-fit"
        modal
      >
        <Button variant="ghost" className="hover:bg-item-active" prefix={<DotsVertical />} />
      </Dropdown>
    </div>
  );
};
