import { and, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { assetSearchV2 } from '../../schema';
import { PaginationInputSchema, type SearchPaginatedResponse } from '../../schema-types';
import { createPermissionedAssetsSubquery } from './access-control-helpers';

import { AssetTypeSchema } from '../../schema-types/asset';
import type { TextSearchResultSchema } from '../../schema-types/search';

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

export type SearchTextResponse = SearchPaginatedResponse<TextSearchResult>;

/**
 * Search asset_search_v2 table using pgroonga index
 * Uses Full Text Search
 */
export async function searchText(input: SearchTextInput): Promise<SearchTextResponse> {
  try {
    const validated = SearchTextInputSchema.parse(input);
    const { searchString, organizationId, userId, page, page_size, filters } = validated;
    const offset = (page - 1) * page_size;
    const paginationCheckCount = page_size + 1;

    const filterConditions = [];

    if (searchString) {
      const fullSearchString = `${searchString}*`;
      filterConditions.push(
        sql`ARRAY[${assetSearchV2.title}, ${assetSearchV2.additionalText}] &@~ ${fullSearchString}`
      );
    }

    // Asset types filter (multiple asset types)
    if (filters?.assetTypes && filters.assetTypes.length > 0) {
      filterConditions.push(inArray(assetSearchV2.assetType, filters.assetTypes));
    }

    // Date range filter
    if (filters?.dateRange) {
      if (filters.dateRange.startDate) {
        filterConditions.push(gte(assetSearchV2.updatedAt, filters.dateRange.startDate));
      }
      if (filters.dateRange.endDate) {
        filterConditions.push(lte(assetSearchV2.updatedAt, filters.dateRange.endDate));
      }
    }

    // Combine all conditions
    const allConditions = [
      eq(assetSearchV2.organizationId, organizationId),
      isNull(assetSearchV2.deletedAt),
      ...filterConditions,
    ];

    // Create the permissioned assets subquery for this user
    const permissionedAssetsSubquery = createPermissionedAssetsSubquery(userId, organizationId);

    // Execute search query with pagination
    const searchQueryStart = performance.now();
    const results = await db
      .select({
        assetId: assetSearchV2.assetId,
        assetType: assetSearchV2.assetType,
        title: assetSearchV2.title,
        additionalText: assetSearchV2.additionalText,
        updatedAt: assetSearchV2.updatedAt,
      })
      .from(assetSearchV2)
      .innerJoin(
        permissionedAssetsSubquery,
        eq(assetSearchV2.assetId, permissionedAssetsSubquery.assetId)
      )
      .where(and(...allConditions))
      .orderBy(
        sql`pgroonga_score("asset_search_v2".tableoid, "asset_search_v2".ctid) DESC`,
        assetSearchV2.updatedAt
      )
      .limit(paginationCheckCount)
      .offset(offset);

    const hasMore = results.length > page_size;

    if (hasMore) {
      results.pop();
    }

    const searchQueryDuration = performance.now() - searchQueryStart;
    console.info(
      `[SEARCH_TIMING] Main search query completed in ${searchQueryDuration.toFixed(2)}ms - found ${results.length} results`
    );

    const paginatedResponse = {
      data: results,
      pagination: {
        page,
        page_size,
        has_more: hasMore,
      },
    };

    return paginatedResponse;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid search input: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    throw error;
  }
}
