import type { FileRouteTypes } from '@/routeTree.gen';
import type { OptionsTo, OptionsToBase } from '@/types/routes';

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
export function createRoute(options: OptionsTo): OptionsTo {
  return options;
}

/**
 * Factory function to create route builders for specific routes
 * This provides even more type safety by locking in the route path
 *
 * @example
 * const createChatRoute = createRouteFactory('/app/chats/$chatId');
 * const route = createChatRoute({ chatId: '123' });
 */
export function createRouteFactory<
  TTo extends FileRouteTypes['to'],
  TFrom extends FileRouteTypes['to'] = '/',
>(to: TTo) {
  return (
    params: OptionsToBase<TFrom, TTo> extends { params: infer P } ? P : never,
    options?: Omit<OptionsToBase<TFrom, TTo>, 'to' | 'params'>
  ): OptionsTo<TFrom, TTo> => {
    return {
      to,
      params,
      ...options,
    } as OptionsTo<TFrom, TTo>;
  };
}
