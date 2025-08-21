import type { RegisteredRouter } from '@tanstack/react-router';
import { create } from 'lodash';
import type { BusterListRowItem } from './interfaces';

export function createLinkItems<
  T,
  TRouter extends RegisteredRouter,
  TOptions,
  TFrom extends string = string,
>(
  items: BusterListRowItem<T, TRouter, TOptions, TFrom>[]
): BusterListRowItem<T, TRouter, TOptions, TFrom>[] {
  return items;
}

export function createLinkItem<
  T,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = Record<string, unknown>,
  TFrom extends string = string,
>(
  item: BusterListRowItem<T, TRouter, TOptions, TFrom>
): BusterListRowItem<T, TRouter, TOptions, TFrom> {
  return item;
}

const test = createLinkItem({
  id: '1',
  data: {
    name: 'Test',
  },
  link: {
    to: '/app/metrics/$metricId',
    params: {
      metricId: '1',
    },
  },
});

const test2 = createLinkItem<{
  swag: boolean;
}>({
  id: '1',
  data: {
    swag: true,
  },
  link: {
    to: '/app/metrics/$metricId',
    params: {
      metricId: '1',
    },
  },
});
