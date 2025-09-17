import { and, count, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { assetTypeEnum, textSearch } from '../../schema';
import {
  type PaginatedResponse,
  PaginationInputSchema,
  createPaginatedResponse,
} from '../shared-types';
import { createPermissionedAssetsSubquery } from './access-control-helpers';

// Type inference from schema
export const TextSearchResultSchema = z.object({
  assetId: z.string().uuid(),
  assetType: z.string(),
  searchableText: z.string(),
});

// Asset type enum matching the database schema
export const AssetTypeSchema = z.enum(assetTypeEnum.enumValues);

/**
 * Date range filter schema
 */
export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

/**
 * Search filters schema
 */
export const SearchFiltersSchema = z
  .object({
    assetTypes: z.array(AssetTypeSchema).optional(),
    dateRange: DateRangeSchema.optional(),
  })
  .optional();

/**
 * Input schemas for type safety
 */
export const SearchTextInputSchema = z
  .object({
    searchString: z.string().optional(),
    organizationId: z.string().uuid(),
    userId: z.string().uuid(),
    filters: SearchFiltersSchema,
  })
  .merge(PaginationInputSchema);

export type SearchFilters = z.infer<typeof SearchFiltersSchema>;
export type SearchTextInput = z.infer<typeof SearchTextInputSchema>;
export type TextSearchResult = z.infer<typeof TextSearchResultSchema>;

export type SearchTextResponse = PaginatedResponse<TextSearchResult>;

/**
 * Search text_search table using pgroonga index
 * Uses Full Text Search
 */
export async function searchText(input: SearchTextInput): Promise<SearchTextResponse> {
  try {
    const validated = SearchTextInputSchema.parse(input);
    const { searchString, organizationId, userId, page, page_size, filters } = validated;
    const offset = (page - 1) * page_size;

    const filterConditions = [];

    if (searchString) {
      const fullSearchString = `${searchString}*`;
      filterConditions.push(sql`${textSearch.searchableText} &@~ ${fullSearchString}`);
    }

    // Asset types filter (multiple asset types)
    if (filters?.assetTypes && filters.assetTypes.length > 0) {
      console.info('filters.assetTypes', filters.assetTypes);
      filterConditions.push(inArray(textSearch.assetType, filters.assetTypes));
    }

    // Date range filter
    if (filters?.dateRange) {
      if (filters.dateRange.startDate) {
        filterConditions.push(gte(textSearch.updatedAt, filters.dateRange.startDate));
      }
      if (filters.dateRange.endDate) {
        filterConditions.push(lte(textSearch.updatedAt, filters.dateRange.endDate));
      }
    }

    // Combine all conditions
    const allConditions = [
      eq(textSearch.organizationId, organizationId),
      isNull(textSearch.deletedAt),
      ...filterConditions,
    ];

    // Create the permissioned assets subquery for this user
    const permissionedAssetsSubquery = createPermissionedAssetsSubquery(userId, organizationId);

    // Execute search query with pagination
    const results = await db
      .select({
        assetId: textSearch.assetId,
        assetType: textSearch.assetType,
        searchableText: textSearch.searchableText,
      })
      .from(textSearch)
      .innerJoin(
        permissionedAssetsSubquery,
        eq(textSearch.assetId, permissionedAssetsSubquery.assetId)
      )
      .where(and(...allConditions))
      .orderBy(sql`pgroonga_score("text_search".tableoid, "text_search".ctid) DESC`)
      .limit(page_size)
      .offset(offset);

    // Get total count for pagination - also needs to respect permissions
    const [countResult] = await db
      .select({
        count: count(),
      })
      .from(textSearch)
      .innerJoin(
        permissionedAssetsSubquery,
        eq(textSearch.assetId, permissionedAssetsSubquery.assetId)
      )
      .where(and(...allConditions));

    const paginatedResponse = createPaginatedResponse({
      data: results,
      page,
      page_size,
      total: countResult?.count ?? 0,
    });

    return paginatedResponse;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid search input: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    throw error;
  }
}
