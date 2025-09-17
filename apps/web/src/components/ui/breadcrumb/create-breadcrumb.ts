import type { RegisteredRouter } from '@tanstack/react-router';
import type { BreadcrumbItemType } from './Breadcrumb';

export function createBreadcrumbItems<
  TRouter extends RegisteredRouter,
  TOptions,
  TFrom extends string = string,
>(
  items: BreadcrumbItemType<TRouter, TOptions, TFrom>[]
): BreadcrumbItemType<TRouter, TOptions, TFrom>[] {
  return items;
}

export function createBreadcrumbItem<
  TRouter extends RegisteredRouter,
  TOptions,
  TFrom extends string = string,
>(
  item: BreadcrumbItemType<TRouter, TOptions, TFrom>
): BreadcrumbItemType<TRouter, TOptions, TFrom> {
  return item;
}
