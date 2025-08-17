import type { FileRouteTypes } from '@/routeTree.gen';
import type { OptionsTo, OptionsToBase } from '@/types/routes';

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
function navigationOptionsToHref<
  TFrom extends FileRouteTypes['to'] = '/',
  TTo extends string | undefined = undefined,
>(options: OptionsToBase<TFrom, TTo>): string {
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
export const routeToHref = navigationOptionsToHref;
