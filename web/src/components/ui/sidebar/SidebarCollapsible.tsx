import React from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '../collapsible/CollapsibleBase';
import { type ISidebarGroup } from './interfaces';
import { SidebarItem } from './SidebarItem';
import { CaretDown } from '../icons/NucleoIconFilled';
import { cn } from '@/lib/classMerge';

interface SidebarTriggerProps {
  label: string;
  isOpen: boolean;
}

const SidebarTrigger: React.FC<SidebarTriggerProps> = React.memo(({ label, isOpen }) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded px-1.5 py-1 text-base transition-colors',
        'text-text-secondary hover:bg-nav-item-hover',
        'group cursor-pointer'
      )}>
      <span className="">{label}</span>

      <div
        className={cn(
          'text-icon-color text-3xs -rotate-90 transition-transform duration-200',
          isOpen && 'rotate-0'
        )}>
        <CaretDown />
      </div>
    </div>
  );
});

SidebarTrigger.displayName = 'SidebarTrigger';

export const SidebarCollapsible: React.FC<ISidebarGroup & { activeItem?: string }> = React.memo(
  ({ label, items, activeItem, variant = 'collapsible', icon, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-0.5">
        {variant === 'collapsible' && (
          <CollapsibleTrigger asChild className="w-full">
            <button className="w-full text-left">
              <SidebarTrigger label={label} isOpen={isOpen} />
            </button>
          </CollapsibleTrigger>
        )}

        {variant === 'icon' && (
          <div
            className={cn(
              'flex items-center space-x-2.5 px-1.5 py-1 text-base',
              'text-text-secondary'
            )}>
            {icon && <span className="text-icon-color text-icon-size">{icon}</span>}
            <span className="">{label}</span>
          </div>
        )}

        <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up pl-0">
          <div className="space-y-0.5">
            {items.map((item) => (
              <SidebarItem
                key={item.id + item.route}
                {...item}
                active={activeItem === item.id || item.active}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }
);

SidebarCollapsible.displayName = 'SidebarCollapsible';
