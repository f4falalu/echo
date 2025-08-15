import type { FileRouteTypes } from '@/routeTree.gen';
import type { OptionsTo } from '@/types/routes';

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
>(options: OptionsTo<TFrom, TTo, TMaskFrom, TMaskTo>): OptionsTo<TFrom, TTo, TMaskFrom, TMaskTo> {
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
  TTo extends FileRouteTypes['id'],
  TFrom extends FileRouteTypes['id'] = '/',
>(to: TTo) {
  return (
    params: OptionsTo<TFrom, TTo> extends { params: infer P } ? P : never,
    options?: Omit<OptionsTo<TFrom, TTo>, 'to' | 'params'>
  ): OptionsTo<TFrom, TTo> => {
    return {
      to,
      params,
      ...options,
    } as OptionsTo<TFrom, TTo>;
  };
}
