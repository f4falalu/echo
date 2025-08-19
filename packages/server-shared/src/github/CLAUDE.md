# CLAUDE.md - GitHub Types Module

## Context for Claude

This module defines all TypeScript types and Zod schemas for the GitHub OAuth integration. When working with these types, follow these conventions:

## Key Principles

1. **Always export both schema and type**: Every Zod schema should have a corresponding TypeScript type exported
2. **Use Zod for runtime validation**: Don't rely on TypeScript alone for API boundaries
3. **Keep types in sync with database**: Schema types must match the database githubIntegrations table

## File Organization

- Each concern gets its own file (requests, responses, errors)
- Index file only exports, no logic
- Test files validate all schema variations

## Common Patterns

### Creating New Request Types
```typescript
// 1. Define the Zod schema
export const NewFeatureRequestSchema = z.object({
  installationId: z.string(),
  feature: z.string(),
});

// 2. Export the inferred type
export type NewFeatureRequest = z.infer<typeof NewFeatureRequestSchema>;

// 3. Add to index.ts exports
```

### Error Handling Pattern
When adding new error codes:
1. Add to `GitHubErrorCode` enum
2. Document when it's thrown in comments
3. Map to HTTP status in handler layer

## Type Guidelines

### Installation Status Values
```typescript
'pending'    // Just installed, token not yet generated
'active'     // Token generated and working
'suspended'  // GitHub suspended the installation
'revoked'    // User uninstalled (soft deleted)
```

### GitHub Action Types
From GitHub webhooks:
```typescript
'created'    // New installation
'deleted'    // App uninstalled
'suspend'    // Installation suspended by GitHub
'unsuspend'  // Installation reactivated
```

## Testing Requirements

When adding new types:
1. Add test cases for valid payloads
2. Add test cases for invalid payloads
3. Test edge cases (empty strings, nulls, etc.)
4. Verify error messages are helpful

## Integration Points

### With Database Layer
- Types here must match `githubIntegrations` table schema
- Status enum values must be consistent

### With Service Layer
- Request types validated at API boundary
- Response types structured for frontend consumption

### With GitHub API
- Webhook payloads follow GitHub's schema
- Token response matches GitHub's format

## Common Mistakes to Avoid

1. ❌ Don't add business logic here - only types
2. ❌ Don't use `.parse()` in type definitions - that's for handlers
3. ❌ Don't forget to export from index.ts
4. ❌ Don't use `any` type - be specific
5. ❌ Don't mix GitHub's types with our internal types

## Adding New Features

When GitHub integration needs new features:
1. Start by defining types here
2. Add corresponding database queries if needed
3. Implement service layer logic
4. Wire up in handlers
5. Add tests at each layer

## Debugging Tips

- If validation fails, check the error.issues array for details
- Use `.safeParse()` during development for better error messages
- GitHub webhook payloads can be tested with ngrok locally