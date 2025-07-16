# Pagination Utilities

This directory contains reusable pagination utilities for Drizzle ORM queries.

## Overview

The pagination utilities provide a consistent way to add offset-based pagination to your database queries. They handle:

- Page calculation and offset computation
- Total count queries
- Consistent response format
- Type safety

## Recommended Usage

### Primary Method: `withPaginationMeta` (Handles Count Automatically)

This is the **recommended approach** for most use cases as it handles the count query for you:

```typescript
import { eq, desc } from 'drizzle-orm';
import { db } from '@/database';
import { users } from '@/schema';
import { withPaginationMeta } from '@/queries/shared-types';

const result = await withPaginationMeta({
  query: db
    .select()
    .from(users)
    .where(eq(users.active, true))
    .$dynamic(),
  orderBy: desc(users.createdAt),
  page: 2,
  page_size: 10,
  countFrom: users,
  countWhere: eq(users.active, true), // Optional: same conditions as main query
});

// Result shape:
// {
//   data: User[],
//   pagination: {
//     page: number,
//     page_size: number,
//     total: number,      // Automatically calculated
//     total_pages: number  // Automatically calculated
//   }
// }
```

### Simple Pagination: `withPagination` (No Count Query)

Use this when you only need paginated results without metadata:

```typescript
import { db } from '@/database';
import { users } from '@/schema';
import { withPagination } from '@/queries/shared-types';

// Your base query needs to use .$dynamic()
const query = db.select().from(users).$dynamic();

// Apply pagination
const paginatedQuery = withPagination(query, users.createdAt, 2, 10);
const results = await paginatedQuery;
// Note: This only returns the data, no pagination metadata
```

### Special Cases: `createPaginatedResponse` (Manual Count)

Only use this when you:
- Already have the total count from another source
- Need to transform data after querying
- Are working with non-database data

```typescript
import { createPaginatedResponse } from '@/queries/shared-types';

// Example: When you already have count from elsewhere
const transformedData = existingData.map(item => ({
  ...item,
  displayName: item.name || 'Unnamed'
}));

const response = createPaginatedResponse({
  data: transformedData,
  page: 1,
  page_size: 10,
  total: existingTotalCount, // You must provide this
});
```

## API Reference

### Types

#### `PaginationInput`
```typescript
interface PaginationInput {
  page?: number;      // Current page (default: 1)
  page_size?: number; // Items per page (default: 250, max: 1000)
}
```

#### `PaginationMetadata`
```typescript
interface PaginationMetadata {
  page: number;       // Current page
  page_size: number;  // Items per page
  total: number;      // Total number of items
  total_pages: number; // Total number of pages
}
```

#### `PaginatedResponse<T>`
```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}
```

### Functions

#### `withPaginationMeta(options)` ⭐ Recommended
Executes a paginated query and automatically handles the count query.

#### `withPagination(query, orderBy, page?, pageSize?)`
Adds pagination to a dynamic query without executing it or counting.

#### `createPaginatedResponse(options)`
Creates a paginated response when you already have the total count.

#### `createPaginationMetadata(options)`
Creates just the pagination metadata from count and page info.

## Best Practices

1. **Use `withPaginationMeta` by default**: It handles counting automatically
2. **Always use ordering**: Pagination without ordering can lead to inconsistent results
3. **Match WHERE conditions**: When using `countWhere`, ensure it matches your query's WHERE clause
4. **Consider performance**: For very large tables, consider cursor-based pagination
5. **Set reasonable limits**: Default page size is 250, max is 1000 to prevent performance issues

## Common Patterns

### Using the Composable Approach with JOINs (Recommended)

The `buildPaginationQueries` helper ensures your count query has the same structure as your data query:

```typescript
import { and, eq, isNull, asc } from 'drizzle-orm';
import { 
  buildPaginationQueries, 
  withPaginationMeta 
} from '@/queries/shared-types';

// Define your WHERE condition once
const whereCondition = and(
  eq(usersToOrganizations.organizationId, orgId),
  isNull(usersToOrganizations.deletedAt)
);

// Build matching queries with the same structure
const { dataQuery, buildCountQuery } = buildPaginationQueries({
  select: {
    id: users.id,
    name: users.name,
    email: users.email,
    role: usersToOrganizations.role,
    status: usersToOrganizations.status,
  },
  from: users,
  joins: [
    {
      type: 'inner',
      table: usersToOrganizations,
      on: eq(users.id, usersToOrganizations.userId),
    }
  ],
  where: whereCondition,
});

// Use withPaginationMeta to execute both queries
const result = await withPaginationMeta({
  query: dataQuery,
  buildCountQuery,
  orderBy: asc(users.name),
  page: 1,
  page_size: 20,
});
```

### API Endpoint with Automatic Count

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const page_size = parseInt(searchParams.get('per_page') || '25');

  // This handles everything for you
  const result = await withPaginationMeta({
    query: db.select().from(users).$dynamic(),
    orderBy: users.createdAt,
    page,
    page_size,
    countFrom: users,
  });

  return Response.json(result);
}
```

### With Filters

```typescript
const activeUsers = await withPaginationMeta({
  query: db
    .select()
    .from(users)
    .where(and(
      eq(users.active, true),
      like(users.email, '%@company.com')
    ))
    .$dynamic(),
  orderBy: users.email,
  page,
  page_size,
  countFrom: users,
  countWhere: and(  // Same conditions as query
    eq(users.active, true),
    like(users.email, '%@company.com')
  ),
});
```

## Migration Guide

If you're updating existing code:

1. **Replace manual pagination logic** with `withPaginationMeta`:
   ```typescript
   // Before: Manual offset/limit and count
   const offset = (page - 1) * pageSize;
   const data = await db.select().from(users).limit(pageSize).offset(offset);
   const [{ count }] = await db.select({ count: count() }).from(users);
   
   // After: Automatic with withPaginationMeta
   const result = await withPaginationMeta({
     query: db.select().from(users).$dynamic(),
     orderBy: users.id,
     page,
     page_size: pageSize,
     countFrom: users,
   });
   ```

2. **Add `.$dynamic()`** to your query builder
3. **Update response types** to use `PaginatedResponse<T>`

See `pagination.example.ts` for more complete examples. 