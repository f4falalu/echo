import type { NavigateOptions, RegisteredRouter } from '@tanstack/react-router';
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
export type BusterNavigateOptions<
  TFrom extends FileRouteTypes['id'] = '/',
  TTo extends string | undefined = undefined,
  TMaskFrom extends FileRouteTypes['id'] = TFrom,
  TMaskTo extends string = '',
> = NavigateOptions<RegisteredRouter, TFrom, TTo, TMaskFrom, TMaskTo>;

/**
 * Type helper to extract the route options type for a specific route
 *
 * @example
 * type ChatRouteOptions = RouteOptions<'/app/chats/$chatId'>;
 * // This will give you the type with proper params like { chatId: string }
 */
export type RouteOptions<
  TTo extends FileRouteTypes['id'],
  TFrom extends FileRouteTypes['id'] = '/',
> = BusterNavigateOptions<TFrom, TTo>;
