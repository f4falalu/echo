# Database Package

This package owns ALL database interactions in the Buster monorepo. No other package or app should use Drizzle ORM directly.

## Core Responsibility

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

## Query Organization

All queries MUST be organized in the `src/queries/` directory by table/domain:

```
database/
├── src/
│   ├── queries/
│   │   ├── users/
│   │   │   ├── create-user.ts
│   │   │   ├── get-user.ts
│   │   │   ├── update-user.ts
│   │   │   ├── delete-user.ts
│   │   │   └── index.ts        # Barrel export
│   │   ├── organizations/
│   │   │   ├── create-org.ts
│   │   │   ├── get-org.ts
│   │   │   └── index.ts
│   │   ├── chats/
│   │   │   └── ...
│   │   └── index.ts            # Main barrel export
│   ├── schema/
│   │   ├── users.ts           # Table definitions
│   │   ├── organizations.ts
│   │   └── index.ts
│   └── index.ts
```

## Query Patterns

### Basic Query Structure

Every query function must:
1. Accept typed parameters (validated with Zod)
2. Return typed results
3. Handle errors appropriately
4. Be pure and testable

```typescript
import { z } from 'zod';
import { db } from '../../db';
import { users } from '../../schema';
import { eq } from 'drizzle-orm';

// Input validation schema
const GetUserParamsSchema = z.object({
  userId: z.string().uuid().describe('User ID to fetch'),
  includeDeleted: z.boolean().optional().describe('Include soft-deleted users')
});

type GetUserParams = z.infer<typeof GetUserParamsSchema>;

// Query function
export async function getUser(params: GetUserParams) {
  const validated = GetUserParamsSchema.parse(params);
  
  const query = db
    .select()
    .from(users)
    .where(eq(users.id, validated.userId));
  
  // Apply soft delete filter
  if (!validated.includeDeleted) {
    query.where(isNull(users.deletedAt));
  }
  
  const result = await query;
  return result[0] || null;
}
```

### Soft Delete Pattern

We NEVER hard delete records. Always use soft deletes:

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

### Upsert Pattern

Prefer upserts over separate insert/update logic:

```typescript
export async function upsertUser(params: UpsertUserParams) {
  const validated = UpsertUserParamsSchema.parse(params);
  
  const result = await db
    .insert(users)
    .values({
      id: validated.id,
      email: validated.email,
      name: validated.name,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: validated.email,
        name: validated.name,
        updatedAt: new Date()
      }
    })
    .returning();
  
  return result[0];
}
```

### Complex Query Pattern

For complex queries, compose smaller functions:

```typescript
// Small, focused query functions
export async function getUserById(userId: string) {
  return db.select().from(users).where(eq(users.id, userId));
}

export async function getUserOrganizations(userId: string) {
  return db
    .select()
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.orgId, organizations.id))
    .where(eq(organizationMembers.userId, userId));
}

// Compose into complex operation
export async function getUserWithOrganizations(userId: string) {
  const [user, orgs] = await Promise.all([
    getUserById(userId),
    getUserOrganizations(userId)
  ]);
  
  return {
    ...user[0],
    organizations: orgs
  };
}
```

## Schema Patterns

### Table Definition

Use Drizzle schema with proper types and constraints:

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

### Relations

Define relations for complex queries:

```typescript
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many, one }) => ({
  organizations: many(organizationMembers),
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId]
  })
}));
```

## Transaction Patterns

Use transactions for multi-step operations:

```typescript
export async function createUserWithOrg(params: CreateUserWithOrgParams) {
  return await db.transaction(async (tx) => {
    // Create user
    const user = await tx
      .insert(users)
      .values(params.user)
      .returning();
    
    // Create organization
    const org = await tx
      .insert(organizations)
      .values(params.organization)
      .returning();
    
    // Link user to org
    await tx.insert(organizationMembers).values({
      userId: user[0].id,
      orgId: org[0].id,
      role: 'owner'
    });
    
    return { user: user[0], organization: org[0] };
  });
}
```

## Testing Patterns

### Unit Tests

Test query logic with mocked database:

```typescript
describe('getUser', () => {
  it('should return user when exists', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    jest.spyOn(db, 'select').mockResolvedValue([mockUser]);
    
    const result = await getUser({ userId: '123' });
    expect(result).toEqual(mockUser);
  });
  
  it('should filter soft-deleted users by default', async () => {
    const spy = jest.spyOn(db, 'select');
    await getUser({ userId: '123' });
    
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.arrayContaining([
          expect.objectContaining({ deletedAt: null })
        ])
      })
    );
  });
});
```

### Integration Tests

Test with real database connection:

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

## Migration Patterns

Migrations are managed with Drizzle Kit:

```typescript
// migrations/0001_create_users.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
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

## Performance Patterns

### Batch Operations

```typescript
export async function getUsersBatch(userIds: string[]) {
  return db
    .select()
    .from(users)
    .where(inArray(users.id, userIds));
}
```

### Pagination

```typescript
export async function getUsersPaginated(params: PaginationParams) {
  const { page = 1, pageSize = 20 } = params;
  const offset = (page - 1) * pageSize;
  
  const [items, [{ count }]] = await Promise.all([
    db
      .select()
      .from(users)
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: count() })
      .from(users)
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

### Query Optimization

```typescript
// Use select specific columns
export async function getUserEmail(userId: string) {
  return db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId));
}

// Use indexes effectively
export async function getUserByEmail(email: string) {
  return db
    .select()
    .from(users)
    .where(eq(users.email, email)); // Uses email index
}
```

## Export Pattern

Always export through barrel files:

```typescript
// queries/users/index.ts
export * from './create-user';
export * from './get-user';
export * from './update-user';
export * from './delete-user';

// queries/index.ts
export * from './users';
export * from './organizations';
export * from './chats';

// package index.ts
export * from './queries';
export * from './schema';
export type { User, NewUser } from './schema/users';
```

This ensures clean, organized exports for consuming packages.