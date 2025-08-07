import { cn } from '@/lib/classMerge';
import React, { useState } from 'react';
import { Dropdown, type DropdownItems } from '../dropdown';

export const MetricCardThreeMenuContainer = React.memo(
  ({
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
          'w-8.5 rounded transition-opacity duration-75',
          'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100',
          className,
          isOpen && 'pointer-events-auto opacity-100'
        )}>
        <div className="absolute top-3 right-1.5">
          <Dropdown items={dropdownItems} side="top" align="end" onOpenChange={setIsOpen}>
            {children}
          </Dropdown>
        </div>
      </div>
    );
  }
);

MetricCardThreeMenuContainer.displayName = 'MetricCardThreeMenuContainer';
