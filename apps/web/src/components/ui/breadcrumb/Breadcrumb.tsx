import { Link, type RegisteredRouter } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import type { ILinkProps } from '@/types/routes';
import { Dropdown, type IDropdownItem } from '../dropdown';
import {
  Breadcrumb as BreadcrumbBase,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './BreadcrumbBase';

export interface BreadcrumbItemType<
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = Record<string, unknown>,
  TFrom extends string = string,
> {
  label: string | null; //if null, it will be an ellipsis
  link?: ILinkProps<TRouter, TOptions, TFrom>;
  dropdown?: { label: string; link: ILinkProps }[];
}

interface BreadcrumbProps<
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = Record<string, unknown>,
  TFrom extends string = string,
> {
  items: BreadcrumbItemType<TRouter, TOptions, TFrom>[];
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
              isLast={index === lastItemIndex}
              isActive={chosenIndex === index}
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
        {item.link ? (
          <Link {...item.link} className="truncate">
            {item.label}
          </Link>
        ) : (
          <span className="truncate">{item.label}</span>
        )}
      </BreadcrumbLink>
    );
  }, [isActive, item.label, item.link, item.dropdown]);

  return (
    <>
      <BreadcrumbItem className={isLast ? 'truncate' : ''}>{ChosenComponent}</BreadcrumbItem>
      {!isLast && <BreadcrumbSeparator />}
    </>
  );
};

const BreadcrumbDropdown: React.FC<{
  items: { label: string; link: ILinkProps }[];
}> = ({ items }) => {
  const dropdownItems: IDropdownItem[] = useMemo(() => {
    return items.map((item) => {
      return {
        label: (
          <Link {...item.link} className="truncate">
            {item.label}
          </Link>
        ),
        value: JSON.stringify(item.link),
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
