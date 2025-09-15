# Database Package

The database layer for the Buster monorepo. This package owns ALL database interactions - no other package or app should use Drizzle ORM directly.

## Installation

```bash
pnpm add @buster/database
```

## Overview

`@buster/database` is the single source of truth for:
- Database schema definitions
- All database queries
- Migrations
- Database utilities and helpers

## Cardinal Rule

🚨 **ALL DATABASE INTERACTIONS MUST GO THROUGH THIS PACKAGE** 🚨

No other package or app should:
- Import Drizzle directly
- Write raw SQL queries
- Access database tables directly
- Create database connections

## Architecture

```
Apps/Packages → @buster/database → PostgreSQL (via Drizzle)
                      ↓
                   Queries folder
                (All DB operations)
```

## File Organization

```
database/
├── src/
│   ├── queries/
│   │   ├── users/
│   │   │   ├── create-user.ts
│   │   │   ├── get-user.ts
│   │   │   ├── update-user.ts
│   │   │   ├── delete-user.ts
│   │   │   └── index.ts
│   │   ├── organizations/
│   │   ├── chats/
│   │   └── index.ts
│   ├── schema/
│   │   ├── users.ts
│   │   ├── organizations.ts
│   │   └── index.ts
│   └── index.ts
```

## Usage

### Basic Query Example

```typescript
import { getUser, createUser, updateUser } from '@buster/database';

// Get a user
const user = await getUser({ 
  userId: '123',
  includeDeleted: false 
});

// Create a user
const newUser = await createUser({
  email: 'user@example.com',
  name: 'John Doe',
  organizationId: 'org-123'
});

// Update a user (upsert)
const updated = await updateUser({
  userId: '123',
  name: 'Jane Doe',
  updatedAt: new Date()
});
```

### Query Pattern

Every query function must:
1. Accept typed parameters (validated with Zod)
2. Return typed results
3. Handle errors appropriately
4. Be pure and testable

```typescript
import { z } from 'zod';

const GetUserParamsSchema = z.object({
  userId: z.string().uuid().describe('User ID to fetch'),
  includeDeleted: z.boolean().optional().describe('Include soft-deleted users')
});

type GetUserParams = z.infer<typeof GetUserParamsSchema>;

export async function getUser(params: GetUserParams) {
  const validated = GetUserParamsSchema.parse(params);
  
  const query = db
    .select()
    .from(users)
    .where(eq(users.id, validated.userId));
  
  if (!validated.includeDeleted) {
    query.where(isNull(users.deletedAt));
  }
  
  const result = await query;
  return result[0] || null;
}
```

## Key Patterns

### Soft Deletes

We NEVER hard delete records:

```typescript
export async function deleteUser(params: DeleteUserParams) {
  const validated = DeleteUserParamsSchema.parse(params);
  
  // Soft delete by setting deletedAt
  const result = await db
    .update(users)
    .set({ 
      deletedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(users.id, validated.userId))
    .returning();
  
  return result[0];
}
```

### Upserts

Prefer upserts over separate insert/update logic:

```typescript
export async function upsertUser(params: UpsertUserParams) {
  const validated = UpsertUserParamsSchema.parse(params);
  
  const result = await db
    .insert(users)
    .values(validated)
    .onConflictDoUpdate({
      target: users.id,
      set: {
        ...validated,
        updatedAt: new Date()
      }
    })
    .returning();
  
  return result[0];
}
```

### Transactions

Use transactions for multi-step operations:

```typescript
export async function createUserWithOrg(params: CreateUserWithOrgParams) {
  return await db.transaction(async (tx) => {
    const user = await tx.insert(users).values(params.user).returning();
    const org = await tx.insert(organizations).values(params.organization).returning();
    
    await tx.insert(organizationMembers).values({
      userId: user[0].id,
      orgId: org[0].id,
      role: 'owner'
    });
    
    return { user: user[0], organization: org[0] };
  });
}
```

### Pagination

```typescript
export async function getUsersPaginated(params: PaginationParams) {
  const { page = 1, pageSize = 20 } = params;
  const offset = (page - 1) * pageSize;
  
  const [items, [{ count }]] = await Promise.all([
    db.select().from(users).limit(pageSize).offset(offset),
    db.select({ count: count() }).from(users)
  ]);
  
  return {
    items,
    total: count,
    page,
    pageSize,
    hasMore: offset + items.length < count
  };
}
```

## Schema Definition

```typescript
import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at') // For soft deletes
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

## Migrations

```bash
# Generate migration
pnpm db:generate

# Run migrations
pnpm db:migrate

# Push to database (development)
pnpm db:push
```

## Testing

### Unit Tests

```typescript
describe('getUser', () => {
  it('should return user when exists', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    jest.spyOn(db, 'select').mockResolvedValue([mockUser]);
    
    const result = await getUser({ userId: '123' });
    expect(result).toEqual(mockUser);
  });
  
  it('should filter soft-deleted users by default', async () => {
    const result = await getUser({ userId: '123' });
    // Verify deletedAt filter was applied
  });
});
```

### Integration Tests

```typescript
describe('users.int.test.ts', () => {
  beforeEach(async () => {
    await db.delete(users); // Clean state
  });
  
  it('should create and retrieve user', async () => {
    const created = await createUser({
      email: 'test@example.com',
      name: 'Test User'
    });
    
    const retrieved = await getUser({ userId: created.id });
    expect(retrieved).toEqual(created);
  });
});
```

## Best Practices

### DO:
- Organize queries by table/domain
- Validate all inputs with Zod
- Use soft deletes (deletedAt field)
- Prefer upserts over separate insert/update
- Return typed results
- Use transactions for multi-step operations
- Create focused, composable query functions

### DON'T:
- Use Drizzle outside this package
- Write raw SQL unless absolutely necessary
- Hard delete records
- Create queries in random locations
- Mix business logic with database queries
- Forget to handle soft deletes in queries

## Development

```bash
# Build
turbo build --filter=@buster/database

# Test
turbo test:unit --filter=@buster/database
turbo test:integration --filter=@buster/database

# Lint
turbo lint --filter=@buster/database

# Database operations
pnpm db:generate    # Generate migrations
pnpm db:migrate     # Run migrations
pnpm db:push        # Push schema to database
pnpm db:studio      # Open Drizzle Studio
```

## Local Database Access

For integration testing:
```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```