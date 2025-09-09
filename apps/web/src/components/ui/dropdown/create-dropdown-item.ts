import type { RegisteredRouter } from '@tanstack/react-router';
import type { DropdownDivider, IDropdownItem } from './dropdown-items.types';

/**
 * Creates a dropdown typesafe item object for use in dropdown menus. Mostly used for link safety
 * @param item - The dropdown item to create.
 * @returns The dropdown item.
 */
export function createDropdownItem<
  T extends string,
  TRouter extends RegisteredRouter,
  TOptions,
  TFrom extends string = string,
>(
  item: IDropdownItem<T, TRouter, TOptions, TFrom> | DropdownDivider
): IDropdownItem<T, TRouter, TOptions, TFrom> | DropdownDivider {
  return item;
}

/**
 * Creates a divider item for separating dropdown menu sections.
 * @returns The dropdown divider object.
 */
export function createDropdownDivider(): DropdownDivider {
  return {
    type: 'divider',
  };
}

export function createDropdownItems<
  T extends string,
  TRouter extends RegisteredRouter,
  TOptions,
  TFrom extends string = string,
>(
  items: IDropdownItem<T, TRouter, TOptions, TFrom>[]
): IDropdownItem<T, TRouter, TOptions, TFrom>[] {
  return items;
}
