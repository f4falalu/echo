import { cn } from '@/lib/classMerge';
import React, { useState } from 'react';
import { Dropdown, type DropdownItems } from '../dropdown';

export const MetricCardThreeMenuContainer = ({
  children,
  dropdownItems,
  className
}: {
  className?: string;
  children: React.ReactNode;
  dropdownItems: DropdownItems;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      className={cn(
        // Use opacity and pointer-events instead of display:none to maintain positioning context
        '-mr-2 hidden group-hover:block',
        'group-hover:pointer-events-auto',
        isOpen && 'pointer-events-auto block',
        className
      )}>
      <Dropdown items={dropdownItems} side="left" align="center" onOpenChange={setIsOpen}>
        {children}
      </Dropdown>
    </div>
  );
};

MetricCardThreeMenuContainer.displayName = 'MetricCardThreeMenuContainer';
