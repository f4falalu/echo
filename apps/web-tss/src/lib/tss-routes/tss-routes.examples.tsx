import type { OptionsTo, SimpleOptionsTo } from '@/types/routes';
import { acceptsTypeSafeNavigateOptions, createRoute, createRouteFactory } from '.';

// Example 1: Using acceptsTypeSafeNavigateOptions
acceptsTypeSafeNavigateOptions({
  to: '/app/chats/$chatId',
  params: {
    chatId: '123',
  },
});

// Example 2: Using createRoute for type-safe route object creation
createRoute({
  to: '/app/chats/$chatId',
  params: {
    chatId: '123',
  },
});

// Example 3: Using route factory for specific routes
const createChatRoute = createRouteFactory('/app/chats/$chatId');
createChatRoute({ chatId: '456' });

// Example 4: Using type helpers
type ChatRouteOptions = SimpleOptionsTo<'/app/chats/$chatId'>;
const typedRoute: ChatRouteOptions = {
  to: '/app/chats/$chatId',
  params: {
    chatId: '789',
  },
};
acceptsTypeSafeNavigateOptions(typedRoute);

// Example 5: Function that returns type-safe navigation options
function createDashboardRoute(
  chatId: string,
  dashboardId: string
): OptionsTo<'/', '/app/chats/$chatId/dashboard/$dashboardId'> {
  return {
    to: '/app/chats/$chatId/dashboard/$dashboardId',
    params: {
      chatId,
      dashboardId,
    },
  };
}

const dashboardRoute = createDashboardRoute('chat-123', 'dash-456');
acceptsTypeSafeNavigateOptions(dashboardRoute);

// This will throw a type error because params.chatId is missing!
// const mustReturnTypedRoute = (): TestNavigateOptions<'/', '/app/chats/$chatId'> => {
//   return {
//     to: '/app/chats/$chatId',
//     params: {}, // ❌ Type error: Property 'chatId' is missing
//   };
// };

// Correct version with proper params
const correctTypedRoute = (): OptionsTo<'/', '/app/chats/$chatId'> => {
  return {
    to: '/app/chats/$chatId',
    params: {
      chatId: '123', // ✅ Required param provided
    },
  };
};

// Alternative: Let TypeScript infer the return type from createRoute
// const inferredRoute = () => {
//   return createRoute({
//     to: '/app/chats/$chatId',
//     params: {}, // ❌ This will also throw a type error!
//   });
// };
