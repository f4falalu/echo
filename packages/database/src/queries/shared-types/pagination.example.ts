/**
 * Example usage of pagination utilities
 */

import { and, count, desc, eq, like } from 'drizzle-orm';
import { db } from '../../connection';
import { dashboards, users } from '../../schema';
import { createPaginatedResponse, withPagination, withPaginationMeta } from './index';

// Example 1: RECOMMENDED - Pagination with metadata (handles count automatically)
export async function getUsersWithMeta(page = 1, pageSize = 10) {
  const query = db.select().from(users).where(eq(users.name, 'John')).$dynamic();

  // This is the recommended approach - it handles the count query for you
  return await withPaginationMeta({
    query,
    orderBy: desc(users.createdAt),
    page,
    page_size: pageSize,
    countFrom: users,
    countWhere: eq(users.name, 'John'), // Same condition as the main query
  });
}

// Example 2: Simple pagination without metadata (when you don't need count)
export async function getUsers(page = 1, pageSize = 10) {
  const query = db.select().from(users).$dynamic();
  const paginatedQuery = withPagination(query, users.createdAt, page, pageSize);
  return await paginatedQuery;
}

// Example 3: Using in API endpoints
export async function apiHandler(request: { query: { page?: string; per_page?: string } }) {
  const page = request.query.page ? Number.parseInt(request.query.page) : 1;
  const pageSize = request.query.per_page ? Number.parseInt(request.query.per_page) : 25;

  // withPaginationMeta handles everything for you
  const result = await withPaginationMeta({
    query: db.select().from(users).$dynamic(),
    orderBy: desc(users.createdAt),
    page,
    page_size: pageSize,
    countFrom: users,
  });

  // The result has the shape:
  // {
  //   data: User[],
  //   pagination: {
  //     page: number,
  //     page_size: number,
  //     total: number,      // Automatically calculated
  //     total_pages: number // Automatically calculated
  //   }
  // }

  return result;
}

// Example 4: With complex filters
export async function getFilteredDashboards(
  organizationId: string,
  searchTerm: string,
  page = 1,
  pageSize = 20
) {
  const whereCondition = and(
    eq(dashboards.organizationId, organizationId),
    like(dashboards.name, `%${searchTerm}%`)
  );

  const paginationOptions = {
    query: db.select().from(dashboards).where(whereCondition).$dynamic(),
    orderBy: dashboards.createdAt,
    page,
    page_size: pageSize,
    countFrom: dashboards,
    ...(whereCondition && { countWhere: whereCondition }),
  };

  return await withPaginationMeta(paginationOptions);
}

// Example 5: SPECIAL CASE - Manual pagination with custom transformation
// Only use when you need to transform data or already have the count
export async function getDashboardsWithCustomResponse(
  organizationId: string,
  page = 1,
  pageSize = 20
) {
  // Sometimes you might already have the count from another source
  // or need to do custom transformations
  const query = db
    .select()
    .from(dashboards)
    .where(eq(dashboards.organizationId, organizationId))
    .$dynamic();

  const paginatedQuery = withPagination(query, dashboards.createdAt, page, pageSize);
  const results = await paginatedQuery;

  // Maybe you got the count from somewhere else or cached it
  const cachedTotal = await getCachedDashboardCount(organizationId);

  // Transform results with custom logic
  const transformedData = results.map((dashboard) => ({
    ...dashboard,
    displayName: dashboard.name || 'Untitled Dashboard',
    isRecent: new Date(dashboard.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  }));

  // Only use createPaginatedResponse when you already have the total
  return createPaginatedResponse({
    data: transformedData,
    page,
    page_size: pageSize,
    total: cachedTotal,
  });
}

// Helper function (simulated)
async function getCachedDashboardCount(_organizationId: string): Promise<number> {
  // This would normally come from cache or another source
  // In a real app, you'd use the organizationId to look up cached count
  return 42;
}
