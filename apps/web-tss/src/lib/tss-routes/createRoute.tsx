import {
  Link,
  type LinkProps,
  type RegisteredRouter,
  type ValidateLinkOptions,
} from '@tanstack/react-router';
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
export function createRoute(options: OptionsTo): OptionsTo {
  return options;
}

//I am not super in love with this one. Tanstack has it in their docs..,
export function createLinkOptions<TOptions>(
  options: ValidateLinkOptions<RegisteredRouter, TOptions>
) {
  return options;
}

// function createLinkOptions<TOptions>(options: ValidateLinkOptions<RegisteredRouter, TOptions>) {
//   return options;
// }

// function createLinkProps(options: LinkProps) {
//   return options;
// }

// createRoute({
//   to: '/app/chats/$chatId',
//   params: { chatId: '123', reportId: '456' },
// });

// createLinkOptions({
//   to: '/app/chats/$chatId',
//   params: { chatId: '123', reportId: '456' },
// });

// createLinkProps({
//   to: '/app/chats/$chatId',
//   params: { reporhtId: '456' },
// });

// const TestComponent = () => {
//   return (
//     <Link to="/app/chats/$chatId" params={{ chatId: '123', reportId: '456' }}>
//       <div>
//         <h1>Test</h1>
//       </div>
//     </Link>
//   );
// };
