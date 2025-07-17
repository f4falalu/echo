# @buster/database

A TypeScript database library using Drizzle ORM with PostgreSQL connection pooling. This library provides a centralized database connection and schema management for the Buster application.

## Architecture & Patterns

### Schema Definition (`src/schema.ts`)

The database schema is defined using Drizzle ORM. All table definitions and modifications should be made in this file.

#### JSONB Columns with Type Safety

For JSONB columns, we use a specific pattern to ensure type safety:

```typescript
// 1. Define the type in src/schema-types/[entity].ts
export type OrganizationColorPalette = {
  id: string | number;
  colors: string[]; // Hex color codes
};

export type OrganizationColorPalettes = OrganizationColorPalette[];

// 2. Export from src/schema-types/index.ts
export * from './organization';

// 3. Use in schema.ts with .$type<T>()
import type { OrganizationColorPalettes } from './schema-types';

export const organizations = pgTable('organizations', {
  // ... other columns
  organizationColorPalettes: jsonb('organization_color_palettes')
    .$type<OrganizationColorPalettes>()
    .default(sql`'[]'::jsonb`)
    .notNull(),
});
```

### Query Organization (`src/queries/`)

**ALL DATABASE INTERACTIONS MUST GO THROUGH THE QUERIES FOLDER**. Direct database access outside of this folder is not allowed.

#### Directory Structure

```
queries/
├── shared-types/          # Reusable query utilities and types
│   ├── pagination.types.ts
│   ├── with-pagination.ts
│   └── index.ts
├── organizations/         # Domain-specific queries
│   ├── organizations.ts
│   ├── update-organization.ts
│   └── index.ts
├── users/
│   ├── user.ts
│   ├── users-to-organizations.ts
│   └── index.ts
└── index.ts              # Exports all query modules
```

#### Query Function Pattern

Every query function follows this pattern:

```typescript
import { z } from 'zod';
import { type InferSelectModel } from 'drizzle-orm';
import { db } from '../../connection';
import { tableName } from '../../schema';

// 1. Type inference from schema
type TableType = InferSelectModel<typeof tableName>;

// 2. Input validation schema using Zod
const GetSomethingInputSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
  // ... other fields
});

type GetSomethingInput = z.infer<typeof GetSomethingInputSchema>;

// 3. Query function with proper error handling
export async function getSomething(params: GetSomethingInput): Promise<TableType> {
  try {
    // Validate input
    const validated = GetSomethingInputSchema.parse(params);
    
    // Execute query
    const result = await db
      .select()
      .from(tableName)
      .where(/* conditions */)
      .limit(1);
    
    if (!result.length || !result[0]) {
      throw new Error('Resource not found');
    }
    
    return result[0];
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid input: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    throw error;
  }
}
```

### Pagination Pattern

For paginated queries, use the shared pagination utilities:

```typescript
import { withPagination, createPaginatedResponse, type PaginatedResponse } from '../shared-types';

const GetUsersInputSchema = z.object({
  page: z.number().optional().default(1),
  page_size: z.number().optional().default(250),
  // ... other filters
});

export async function getUsers(params: GetUsersInput): Promise<PaginatedResponse<User>> {
  const { page, page_size } = GetUsersInputSchema.parse(params);
  
  // Build base query
  const baseQuery = db
    .select()
    .from(users)
    .where(/* conditions */)
    .$dynamic(); // Required for withPagination
  
  // Apply pagination
  const getData = withPagination(baseQuery, users.name, page, page_size);
  
  // Get total count
  const getTotal = db
    .select({ count: count() })
    .from(users)
    .where(/* same conditions */);
  
  // Execute in parallel
  const [data, totalResult] = await Promise.all([getData, getTotal]);
  
  return createPaginatedResponse({
    data,
    page,
    page_size,
    total: totalResult[0]?.count ?? 0,
  });
}
```

### Type Safety Patterns

#### Using Pick for Specific Types

When you need only specific fields from multiple tables:

```typescript
// Type-safe subset using Pick
type OrganizationUser = Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'> &
  Pick<UserToOrganization, 'role' | 'status'>;
```

#### Update Operations

For update operations, validate input and build update objects dynamically:

```typescript
const UpdateOrganizationInputSchema = z.object({
  organizationId: z.string().uuid(),
  organizationColorPalettes: z.array(ColorPaletteSchema).optional(),
});

export async function updateOrganization(params: UpdateOrganizationInput): Promise<void> {
  const validated = UpdateOrganizationInputSchema.parse(params);
  
  // Build update data dynamically
  const updateData: Partial<Organization> = {
    updatedAt: new Date().toISOString(),
  };
  
  if (validated.organizationColorPalettes !== undefined) {
    updateData.organizationColorPalettes = validated.organizationColorPalettes;
  }
  
  await db
    .update(organizations)
    .set(updateData)
    .where(eq(organizations.id, validated.organizationId));
}
```

## Best Practices

1. **Always use Zod for input validation** - Parse inputs before using them in queries
2. **Export types alongside functions** - Make types available for consumers
3. **Use InferSelectModel for type safety** - Derive types from schema definitions
4. **Handle errors explicitly** - Differentiate between validation errors and database errors
5. **Use transactions for multi-step operations** - Ensure data consistency
6. **Parallel queries when possible** - Use `Promise.all()` for independent queries
7. **Consistent naming** - Use `get`, `create`, `update`, `delete` prefixes

## Adding New Queries

1. Create a new folder under `queries/` for your domain if it doesn't exist
2. Create query files following the pattern above
3. Export all functions from an `index.ts` in your domain folder
4. Add the export to the main `queries/index.ts`

## Running Migrations

```bash
# Generate migration from schema changes
pnpm drizzle-kit generate:pg

# Apply migrations
pnpm run migrations

# Push schema changes directly (development only)
pnpm drizzle-kit push:pg
```

## Testing

Query functions should be tested with integration tests that use a test database. Unit tests can mock the database connection for isolated testing.

```typescript
// Example test structure
describe('getUserOrganization', () => {
  it('should return user organization data', async () => {
    const result = await getUserOrganization({ userId: 'valid-uuid' });
    expect(result).toMatchObject({
      organizationId: expect.any(String),
      role: expect.any(String),
    });
  });
  
  it('should throw on invalid UUID', async () => {
    await expect(getUserOrganization({ userId: 'invalid' }))
      .rejects.toThrow('User ID must be a valid UUID');
  });
});
```
