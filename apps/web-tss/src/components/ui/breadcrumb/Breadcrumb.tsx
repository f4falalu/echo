import { Link } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import type { OptionsTo } from '@/types/routes';
import { Dropdown, type DropdownItem } from '../dropdown/Dropdown';
import {
  Breadcrumb as BreadcrumbBase,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './BreadcrumbBase';

export interface BreadcrumbItemType {
  label: string | null; //if null, it will be an ellipsis
  route?: OptionsTo;
  dropdown?: { label: string; route: OptionsTo }[];
}

interface BreadcrumbProps {
  items: BreadcrumbItemType[];
  className?: string;
  activeIndex?: number; //default will be the last item
}

export const Breadcrumb = React.memo(
  React.forwardRef<HTMLElement, BreadcrumbProps>(({ items, activeIndex, className }, ref) => {
    const chosenIndex = activeIndex ?? items.length - 1;
    const lastItemIndex = items.length - 1;

    return (
      <BreadcrumbBase className={className} ref={ref}>
        <BreadcrumbList>
          {items.map((item, index) => (
            <BreadcrumbItemSelector
              key={`${item.label ?? 'ellipsis'}-${index}`}
              item={item}
              isActive={chosenIndex === index}
              isLast={index === lastItemIndex}
            />
          ))}
        </BreadcrumbList>
      </BreadcrumbBase>
    );
  })
);

const BreadcrumbItemSelector: React.FC<{
  item: BreadcrumbItemType;
  isActive: boolean;
  isLast: boolean;
}> = ({ item, isActive, isLast }) => {
  const ChosenComponent = useMemo(() => {
    if (item.dropdown) {
      return <BreadcrumbDropdown items={item.dropdown} />;
    }
    if (isActive) {
      return <BreadcrumbPage>{item.label}</BreadcrumbPage>;
    }

    return (
      <BreadcrumbLink asChild>
        {item.route ? (
          <Link {...item.route} className="truncate">
            {item.label}
          </Link>
        ) : (
          <span className="truncate">{item.label}</span>
        )}
      </BreadcrumbLink>
    );
  }, [isActive, item.label, item.route, item.dropdown]);

  return (
    <>
      <BreadcrumbItem className={isLast ? 'truncate' : ''}>{ChosenComponent}</BreadcrumbItem>
      {!isLast && <BreadcrumbSeparator />}
    </>
  );
};

const BreadcrumbDropdown: React.FC<{
  items: { label: string; route: OptionsTo }[];
}> = ({ items }) => {
  const dropdownItems: DropdownItem[] = useMemo(() => {
    return items.map((item) => {
      return {
        label: (
          <Link {...item.route} className="truncate">
            {item.label}
          </Link>
        ),
        value: JSON.stringify(item.route),
      };
    });
  }, [items]);

  return (
    <Dropdown items={dropdownItems}>
      <div className="flex cursor-pointer items-center">
        <BreadcrumbEllipsis className="h-4 w-4" />
        <span className="sr-only">Toggle menu</span>
      </div>
    </Dropdown>
  );
};

Breadcrumb.displayName = 'Breadcrumb';
