import type { RegisteredRouter } from '@tanstack/react-router';
import { defineLink } from '../../../lib/routes';
import type { ISidebarGroup, ISidebarItem, ISidebarList } from './interfaces';

export function createSidebarItem<
  TRouter extends RegisteredRouter,
  TOptions,
  TFrom extends string = string,
>(item: ISidebarItem<TRouter, TOptions, TFrom> & { show?: boolean }) {
  return item as ISidebarItem & { show?: boolean };
}

/**
 * Creates an array of typesafe sidebar items for use in sidebar components.
 * Provides type safety for router links and maintains consistency across sidebar items.
 * @param items - Array of sidebar items to create.
 * @returns Array of typed sidebar items.
 */
export function createSidebarItems<
  TRouter extends RegisteredRouter,
  TOptions,
  TFrom extends string = string,
>(items: ISidebarItem<TRouter, TOptions, TFrom>[]): ISidebarItem<TRouter, TOptions, TFrom>[] {
  return items;
}

export function createSidebarList<
  TRouter extends RegisteredRouter,
  TOptions,
  TFrom extends string = string,
>(items: ISidebarList<TRouter, TOptions, TFrom>): ISidebarList<TRouter, TOptions, TFrom> {
  return items;
}

export function createSidebarGroup<
  TRouter extends RegisteredRouter,
  TOptions,
  TFrom extends string = string,
>(items: ISidebarGroup<TRouter, TOptions, TFrom>): ISidebarGroup<TRouter, TOptions, TFrom> {
  return items;
}

const test = createSidebarItem({
  label: 'Test',
  id: '123',
  link: {
    to: '/app/chats/$chatId',
    params: { chatId: '123' },
  },
});

const test123 = createSidebarItem({
  label: 'Test',
  id: '123',
  link: defineLink({
    to: '/app/chats/$chatId',
    params: { chatId: '123' },
  }),
});
