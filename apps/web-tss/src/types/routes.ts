import type { LinkOptions, RegisteredRouter, ValidateLinkOptions } from '@tanstack/react-router';

export type ILinkOptions = Partial<
  Pick<
    LinkOptions,
    | 'preload'
    | 'preloadDelay'
    | 'disabled'
    | 'preloadIntentProximity'
    | 'ignoreBlocker'
    | 'activeOptions'
    | 'reloadDocument'
  >
>;

export type ILinkProps<
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = Record<string, unknown>,
  TFrom extends string = string,
> = ValidateLinkOptions<TRouter, TOptions, TFrom> & ILinkOptions;
