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
 * Type-safe navigate function for testing that matches the behavior of useNavigate()
 * This function provides the same type safety as the regular navigate hook
 * by leveraging the RegisteredRouter type which contains all route definitions
 */
export function acceptsTypeSafeNavigateOptions<
  TFrom extends FileRouteTypes['id'] = '/',
  TTo extends string | undefined = undefined,
  TMaskFrom extends FileRouteTypes['id'] = TFrom,
  TMaskTo extends string = '',
>(options: BusterNavigateOptions<TFrom, TTo, TMaskFrom, TMaskTo>): void {
  // In a test environment, you might want to just log or store the navigation
  // For actual implementation, you could:
  // 1. Store the navigation in a test spy
  // 2. Update window.location in a test environment
  // 3. Use a mock router's navigate method

  // For now, just log it
  console.log('Test navigation called with:', options);
}

/**
 * Creates a type-safe route object that can be passed to testNavigate
 * This function helps ensure that route creation is type-safe
 *
 * @example
 * const route = createRoute({
 *   to: '/app/chats/$chatId',
 *   params: {
 *     chatId: '123'
 *   }
 * });
 * testNavigate(route);
 *
 * @example
 * // Use it in a function to return type-safe navigation options
 * const createMyRoute = () => {
 *   return createRoute({
 *     to: '/app/chats/$chatId',
 *     params: {
 *       chatId: '123'
 *     }
 *   });
 * };
 */
export function createRoute<
  TFrom extends FileRouteTypes['id'] = '/',
  TTo extends string | undefined = undefined,
  TMaskFrom extends FileRouteTypes['id'] = TFrom,
  TMaskTo extends string = '',
>(
  options: BusterNavigateOptions<TFrom, TTo, TMaskFrom, TMaskTo>
): BusterNavigateOptions<TFrom, TTo, TMaskFrom, TMaskTo> {
  return options;
}

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

/**
 * Factory function to create route builders for specific routes
 * This provides even more type safety by locking in the route path
 *
 * @example
 * const createChatRoute = createRouteFactory('/app/chats/$chatId');
 * const route = createChatRoute({ chatId: '123' });
 */
export function createRouteFactory<
  TTo extends FileRouteTypes['id'],
  TFrom extends FileRouteTypes['id'] = '/',
>(to: TTo) {
  return (
    params: BusterNavigateOptions<TFrom, TTo> extends { params: infer P } ? P : never,
    options?: Omit<BusterNavigateOptions<TFrom, TTo>, 'to' | 'params'>
  ): BusterNavigateOptions<TFrom, TTo> => {
    return {
      to,
      params,
      ...options,
    } as BusterNavigateOptions<TFrom, TTo>;
  };
}

/**
 * Converts navigation options to a URL string (href)
 * This replaces dynamic segments ($param) with actual parameter values
 *
 * @example
 * const navOptions = {
 *   to: '/app/chats/$chatId',
 *   params: { chatId: '123' }
 * };
 * const href = navigationOptionsToHref(navOptions);
 * // Returns: '/app/chats/123'
 *
 * @example
 * // With multiple params
 * const complexNavOptions = {
 *   to: '/app/chats/$chatId/dashboard/$dashboardId',
 *   params: { chatId: '123', dashboardId: '456' }
 * };
 * const complexHref = navigationOptionsToHref(complexNavOptions);
 * // Returns: '/app/chats/123/dashboard/456'
 */
export function navigationOptionsToHref<
  TFrom extends FileRouteTypes['id'] = '/',
  TTo extends string | undefined = undefined,
>(options: BusterNavigateOptions<TFrom, TTo>): string {
  let href = options.to as string;

  // Replace all $param placeholders with actual values from params
  if (options.params && typeof options.params === 'object') {
    Object.entries(options.params).forEach(([key, value]) => {
      // Replace $param with the actual value
      // Use a regex to ensure we only replace the exact $param pattern
      const pattern = new RegExp(`\\$${key}(?=/|$)`, 'g');
      href = href.replace(pattern, encodeURIComponent(String(value)));
    });
  }

  // Add search params if they exist
  if (options.search && typeof options.search === 'object') {
    const searchParams = new URLSearchParams();
    Object.entries(options.search).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const searchString = searchParams.toString();
    if (searchString) {
      href += `?${searchString}`;
    }
  }

  // Add hash if it exists
  if (options.hash) {
    href += `#${options.hash}`;
  }

  return href;
}

/**
 * Shorthand function to get href from navigation options
 * Alias for navigationOptionsToHref
 */
export const toHref = navigationOptionsToHref;
