import { SQL, count } from 'drizzle-orm';
import { PgColumn, PgSelect, PgTable, TableConfig } from 'drizzle-orm/pg-core';
import { db } from '../../connection';
import type { PaginatedResponse, PaginationInput, PaginationMetadata } from './pagination.types';

/**
 * Adds pagination to a Drizzle query using the dynamic query builder pattern
 *
 * @example
 * ```typescript
 * const query = db.select().from(users).$dynamic();
 * const paginatedQuery = withPagination(query, users.id, 2, 10);
 * const results = await paginatedQuery;
 * ```
 */
export function withPagination<T extends PgSelect>(
  qb: T,
  orderByColumn: PgColumn | SQL | SQL.Aliased,
  page = 1,
  pageSize = 250
) {
  return qb
    .orderBy(orderByColumn)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
}

/**
 * Creates pagination metadata from count and pagination parameters
 * Useful when you already have the total count
 *
 * @example
 * ```typescript
 * const metadata = createPaginationMetadata({
 *   total: 100,
 *   page: 2,
 *   page_size: 10
 * });
 * ```
 */
export function createPaginationMetadata({
  total,
  page,
  page_size,
}: {
  total: number;
  page: number;
  page_size: number;
}): PaginationMetadata {
  return {
    page,
    page_size,
    total,
    total_pages: Math.ceil(total / page_size),
  };
}

/**
 * Helper function to create a paginated response from existing data and count.
 *
 * Use this when:
 * - You already have both the data and total count from separate queries
 * - You need to transform the data before creating the response
 * - You're working with data that's not directly from a database query
 *
 * For most cases, prefer `withPaginationMeta` which handles the count query automatically.
 *
 * @example
 * ```typescript
 * // Only use when you already have the count or need custom transformation
 * const users = await customUserQuery();
 * const total = await customCountQuery();
 *
 * return createPaginatedResponse({
 *   data: users.map(u => ({ ...u, displayName: u.name })),
 *   page: 1,
 *   page_size: 10,
 *   total
 * });
 * ```
 */
export function createPaginatedResponse<T>({
  data,
  page,
  page_size,
  total,
}: {
  data: T[];
  page: number;
  page_size: number;
  total: number;
}): PaginatedResponse<T> {
  return {
    data,
    pagination: createPaginationMetadata({ total, page, page_size }),
  };
}

/**
 * Executes a paginated query and returns results with pagination metadata.
 * This version properly handles queries with JOINs by requiring a separate count query builder.
 *
 * @example
 * ```typescript
 * // Simple query
 * const result = await withPaginationMeta({
 *   query: db.select().from(users).where(eq(users.active, true)).$dynamic(),
 *   buildCountQuery: () => db.select({ count: count() }).from(users).where(eq(users.active, true)),
 *   orderBy: users.createdAt,
 *   page: 2,
 *   page_size: 10,
 * });
 *
 * // Query with JOIN
 * const whereCondition = and(
 *   eq(usersToOrganizations.organizationId, orgId),
 *   isNull(usersToOrganizations.deletedAt)
 * );
 *
 * const result = await withPaginationMeta({
 *   query: db
 *     .select()
 *     .from(users)
 *     .innerJoin(usersToOrganizations, eq(users.id, usersToOrganizations.userId))
 *     .where(whereCondition)
 *     .$dynamic(),
 *   buildCountQuery: () => db
 *     .select({ count: count() })
 *     .from(users)
 *     .innerJoin(usersToOrganizations, eq(users.id, usersToOrganizations.userId))
 *     .where(whereCondition),
 *   orderBy: users.name,
 *   page: 1,
 *   page_size: 20,
 * });
 * ```
 */
export async function withPaginationMeta<T extends PgSelect>({
  query,
  buildCountQuery,
  orderBy,
  page = 1,
  page_size = 250,
}: {
  query: T;
  buildCountQuery: () => PgSelect | Promise<{ count: number }[]>;
  orderBy: PgColumn | SQL | SQL.Aliased;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Awaited<ReturnType<T['execute']>>[number]>> {
  // Apply pagination to the query
  const paginatedQuery = withPagination(query, orderBy, page, page_size);

  // Execute both queries in parallel for better performance
  const [results, countResult] = await Promise.all([
    // Execute the paginated query
    paginatedQuery,
    // Execute the count query
    buildCountQuery(),
  ]);

  const total = Number((countResult as any)[0]?.count || 0);
  const total_pages = Math.ceil(total / page_size);

  return {
    data: results,
    pagination: {
      page,
      page_size,
      total,
      total_pages,
    },
  };
}

/**
 * Helper function to build matching data and count queries with the same structure.
 * This ensures your WHERE conditions and JOINs are consistent between both queries.
 *
 * @example
 * ```typescript
 * // Build matching queries for pagination
 * const whereCondition = and(
 *   eq(usersToOrganizations.organizationId, orgId),
 *   isNull(usersToOrganizations.deletedAt)
 * );
 *
 * const { dataQuery, buildCountQuery } = buildPaginationQueries({
 *   select: {
 *     id: users.id,
 *     name: users.name,
 *     email: users.email,
 *     avatarUrl: users.avatarUrl,
 *     role: usersToOrganizations.role,
 *     status: usersToOrganizations.status,
 *   },
 *   from: users,
 *   joins: [
 *     {
 *       type: 'inner',
 *       table: usersToOrganizations,
 *       on: eq(users.id, usersToOrganizations.userId)
 *     }
 *   ],
 *   where: whereCondition,
 * });
 *
 * // Use with withPaginationMeta
 * const result = await withPaginationMeta({
 *   query: dataQuery,
 *   buildCountQuery,
 *   orderBy: users.name,
 *   page: 1,
 *   page_size: 20,
 * });
 * ```
 */
export function buildPaginationQueries<
  TSelect extends Record<string, PgColumn | SQL | SQL.Aliased>,
>({
  select,
  from,
  joins = [],
  where,
}: {
  select: TSelect;
  from: PgTable<TableConfig>;
  joins?: Array<{
    type: 'inner' | 'left' | 'right' | 'full';
    table: PgTable<TableConfig>;
    on: SQL;
  }>;
  where?: SQL;
}) {
  // Function to apply joins to a query
  const applyJoins = (baseQuery: any) => {
    let query = baseQuery;
    for (const join of joins) {
      switch (join.type) {
        case 'inner':
          query = query.innerJoin(join.table, join.on);
          break;
        case 'left':
          query = query.leftJoin(join.table, join.on);
          break;
        case 'right':
          query = query.rightJoin(join.table, join.on);
          break;
        case 'full':
          query = query.fullJoin(join.table, join.on);
          break;
      }
    }
    return query;
  };

  // Build the data query
  let dataQuery = db.select(select).from(from);
  dataQuery = applyJoins(dataQuery);
  if (where) {
    dataQuery = dataQuery.where(where) as any;
  }

  // Build the count query function
  const buildCountQuery = () => {
    let countQuery = db.select({ count: count() }).from(from);
    countQuery = applyJoins(countQuery);
    if (where) {
      countQuery = countQuery.where(where) as any;
    }
    return countQuery;
  };

  return {
    dataQuery: dataQuery.$dynamic(),
    buildCountQuery,
  };
}
