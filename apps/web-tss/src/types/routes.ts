import type {
  LinkOptions,
  LinkProps,
  NavigateOptions,
  RegisteredRouter,
} from '@tanstack/react-router';
import type { FileRouteTypes } from '@/routeTree.gen';

/**
 * Type representing navigation options that can be passed to testNavigate
 * This is useful for creating type-safe route objects
 *
 * IMPORTANT: Always provide type parameters when using this type!
 *
 * ❌ Bad: BusterNavigateOptions (no type safety)
 * ✅ Good: BusterNavigateOptions<'/', '/app/chats/$chatId'>
 *
 * Without type parameters, TypeScript won't enforce required params!
 */
export type OptionsToBase<
  TFrom extends FileRouteTypes['to'] = '/',
  TTo extends string | undefined = undefined,
  TMaskFrom extends FileRouteTypes['to'] = TFrom,
  TMaskTo extends string = '',
> = NavigateOptions<RegisteredRouter, TFrom, TTo, TMaskFrom, TMaskTo>;

/**
 * Smart navigation options that automatically infer required params from the 'to' property
 * Just specify the route in 'to' and TypeScript will automatically require the correct params!
 *
 * ✅ This automatically knows you need { metricId: string }:
 * const route: SmartOptionsTo = {
 *   to: '/app/metrics/$metricId',
 *   params: { metricId: '123' } // <- Required automatically!
 * }
 */
export type OptionsTo<
  TFrom extends FileRouteTypes['to'] = '/',
  TMaskFrom extends FileRouteTypes['to'] = TFrom,
  TMaskTo extends string = '',
> = {
  [K in FileRouteTypes['to']]: {
    to: K;
  } & (OptionsToBase<TFrom, K, TMaskFrom, TMaskTo> extends { params: infer P }
    ? { params: P }
    : { params?: never }) &
    Omit<OptionsToBase<TFrom, K, TMaskFrom, TMaskTo>, 'to' | 'params'>;
}[FileRouteTypes['to']];

export type LinkOptionsTo = OptionsTo &
  Pick<
    LinkOptions,
    | 'preload'
    | 'preloadDelay'
    | 'activeOptions'
    | 'preloadIntentProximity'
    | 'unsafeRelative'
    | 'ignoreBlocker'
    | 'disabled'
    | 'reloadDocument'
    | 'target'
  >;
