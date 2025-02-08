# API Structure Rules

## Directory Structure
Each API namespace should follow this specific structure:

```
src/api/{namespace}/
├── {namespace}Requests.ts   # Contains all request interfaces and types
├── {namespace}Responses.ts  # Contains all response interfaces and types
└── index.ts                # Exports all public interfaces and functions
```

## File Requirements

### {namespace}Requests.ts
- Must contain all request interfaces and types for the namespace
- Each request interface should be prefixed with the namespace
- Must include proper TypeScript types and documentation

```typescript
// Example from chatRequests.ts
import type { BusterSocketRequestBase } from '../base_interfaces';

/**
 * Request type for creating a new chat session or continuing an existing one.
 * @interface ChatCreateNewChat
 * @extends BusterSocketRequestBase
 */
export type ChatCreateNewChat = BusterSocketRequestBase<
  '/chats/post',
  {
    /** The ID of the dataset to associate with the chat. Null if no dataset is associated */
    dataset_id: string | null;
    /** The initial message or prompt to start the chat conversation */
    prompt: string;
    /** Optional ID of an existing chat for follow-up messages. Null for new chats */
    chat_id?: string | null;
    /** Optional ID of a clicked suggestion. If provided, returns that specific chat */
    suggestion_id?: string | null;
    /** Optional ID of a message to replace in an existing chat */
    message_id?: string;
    /** Optional ID of a metric to initialize the chat from */
    metric_id?: string;
    /** Optional ID of a dashboard to initialize the chat from */
    dashboard_id?: string;
  }
>;
```

This example demonstrates:
- Proper namespace prefixing (ChatCreateNewChat)
- Comprehensive JSDoc documentation
- Clear type definitions with proper optional/required fields
- Extension of a base interface (BusterSocketRequestBase)
- Strict typing without use of `any`

### {namespace}Responses.ts
- Must contain all response interfaces and types for the namespace
- Each response interface should be prefixed with the namespace
- Must include proper TypeScript types and documentation
- All response callback types must be imported from `@/api/asset_interfaces` directory
- Response types are typically found under the same namespace in the asset_interfaces directory (e.g., chat types in `asset_interfaces/chat`)
- Must define an enum at the top of the file containing all response routes/events
- Must export a union type at the bottom of the file that includes all response types (e.g., `export type ChatResponseTypes = | Type1 | Type2 | Type3`)

```typescript
// Example of required response routes enum
export enum ChatsResponses {
  '/chats/list:getChatsList' = '/chats/list:getChatsList',
  '/chats/unsubscribe:unsubscribe' = '/chats/unsubscribe:unsubscribe',
  '/chats/get:getChat' = '/chats/get:getChat',
  '/chats/get:getChatAsset' = '/chats/get:getChatAsset',
  '/chats/post:initializeChat' = '/chats/post:initializeChat',
  '/chats/post:generatingTitle' = '/chats/post:generatingTitle'
}
```

/**
 * Example of a properly formatted response type for chat functionality
 */
export type ChatList_getChatsList = {
  /** The route identifier for getting the chats list */
  route: '/chats/list:getChatsList';
  /** Callback function that receives the chat list data */
  callback: (chats: ChatListItem[]) => void;
  /** Optional error handler for when the request fails */
  onError?: (error: ApiError) => void;
};

// At the bottom of the file, export a union type of all response types
export type ChatResponseTypes =
  | ChatList_getChatsList
  | Chat_unsubscribe
  | Chat_getChat
  | Chat_getChatAsset
  | ChatPost_initializeChat
  | ChatPost_generatingTitle
  | ChatPost_generatingMessage;

### index.ts
- Must export all public interfaces, types, and functions
- Should re-export from both requests and responses files
- Should contain any namespace-specific utility functions
- Must use named exports (no default exports)

## Naming Conventions
- All file names must use PascalCase for namespace names
- All interface names must be prefixed with the namespace
- All type names must be prefixed with the namespace
- Use descriptive names that clearly indicate purpose

## Documentation Requirements
- Each interface must have TSDoc comments explaining its purpose
- Each property in interfaces must be documented
- Include examples where appropriate
- Document any validation requirements or constraints

## Type Safety
- Avoid using `any` type. We should NEVER use any types.
- Use strict TypeScript configurations
- Define proper type guards when necessary
- Use generics appropriately for reusable types

## Additional Guidelines
1. Keep files focused and single-responsibility
2. Use TypeScript's strict mode
3. Implement proper error handling types
4. Follow consistent formatting
5. Include proper type exports
6. Maintain backward compatibility
7. Use enums for fixed sets of values