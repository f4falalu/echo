import type { FileRouteTypes } from '@/routeTree.gen';
import type { BusterNavigateOptions } from './types';

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
