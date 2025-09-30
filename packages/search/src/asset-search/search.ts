import {
  type SearchFilters,
  getAssetAncestors,
  getAssetAncestorsWithTransaction,
  getUserOrganizationId,
  searchText,
} from '@buster/database/queries';
import type {
  AssetType,
  SearchTextData,
  SearchTextRequest,
  SearchTextResponse,
} from '@buster/server-shared';
import { processSearchResultText } from './text-processing-helpers';

/**
 * Perform text search and enhance results with asset ancestors
 * @param userId - The user ID making the request
 * @param searchRequest - The search request parameters
 * @returns Promise<SearchTextResponse> - Search results with ancestors
 */
export async function performTextSearch(
  userId: string,
  searchRequest: SearchTextRequest
): Promise<SearchTextResponse> {
  const startTime = performance.now();
  console.info(
    `[SEARCH_PIPELINE_TIMING] Starting performTextSearch for user: ${userId}, query: "${searchRequest.query}"`
  );

  // Get user's organization
  const orgLookupStart = performance.now();
  const userOrg = await getUserOrganizationId(userId);
  const orgLookupDuration = performance.now() - orgLookupStart;

  if (!userOrg) {
    throw new Error('User is not associated with an organization');
  }

  const trimmedQuery = searchRequest.query?.trim();
  const filters: SearchFilters = {};

  if (searchRequest.assetTypes) {
    filters.assetTypes = Array.isArray(searchRequest.assetTypes)
      ? searchRequest.assetTypes
      : [searchRequest.assetTypes];
  }

  if (searchRequest.endDate || searchRequest.startDate) {
    filters.dateRange = {
      endDate: searchRequest.endDate,
      startDate: searchRequest.startDate,
    };
  }

  // Perform the text search
  const searchStart = performance.now();
  let result: SearchTextResponse = await searchText({
    userId,
    searchString: trimmedQuery,
    organizationId: userOrg.organizationId,
    page: searchRequest.page,
    page_size: searchRequest.page_size,
    filters,
  });
  const searchDuration = performance.now() - searchStart;

  // Process search result text (highlighting)
  const textProcessingStart = performance.now();
  const highlightedResults = await Promise.all(
    result.data.map(async (searchResult) => {
      const { processedTitle, processedAdditionalText } = processSearchResultText(
        searchRequest.query ?? '',
        searchResult.title,
        searchResult.additionalText ?? ''
      );
      return {
        ...searchResult,
        title: processedTitle,
        additionalText: processedAdditionalText,
      };
    })
  );
  result = {
    ...result,
    data: highlightedResults,
  };
  const textProcessingDuration = performance.now() - textProcessingStart;

  // Add ancestors if requested
  let ancestorsDuration = 0;
  if (searchRequest.includeAssetAncestors) {
    const ancestorsStart = performance.now();
    const resultsWithAncestors = await addAncestorsToSearchResults(
      result.data,
      userId,
      userOrg.organizationId
    );

    result = {
      ...result,
      data: resultsWithAncestors,
    };
    ancestorsDuration = performance.now() - ancestorsStart;
  }

  const totalDuration = performance.now() - startTime;
  console.info(
    `[SEARCH_PIPELINE_TIMING] performTextSearch completed in ${totalDuration.toFixed(2)}ms total (org: ${orgLookupDuration.toFixed(2)}ms, search: ${searchDuration.toFixed(2)}ms, text: ${textProcessingDuration.toFixed(2)}ms, ancestors: ${ancestorsDuration.toFixed(2)}ms)`
  );

  return result;
}

/**
 * Add ancestors to search results in chunks to avoid overwhelming the database
 * @param searchResults - Array of search results to enhance with ancestors
 * @param userId - The user ID making the request
 * @param organizationId - The organization ID
 * @returns Promise<SearchResult[]> - Search results with ancestors added
 */
async function addAncestorsToSearchResults(
  searchResults: SearchTextData[],
  userId: string,
  organizationId: string
): Promise<SearchTextData[]> {
  const chunkSize = 25;
  const resultsWithAncestors: SearchTextData[] = [];
  const totalChunks = Math.ceil(searchResults.length / chunkSize);

  console.info(
    `[SEARCH_PIPELINE_TIMING] Processing ${searchResults.length} results in ${totalChunks} chunks of ${chunkSize}`
  );

  for (let i = 0; i < searchResults.length; i += chunkSize) {
    const chunk = searchResults.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(async (searchResult) => {
        const ancestors = await getAssetAncestorsWithTransaction(
          searchResult.assetId,
          searchResult.assetType as AssetType,
          userId,
          organizationId
        );

        return {
          ...searchResult,
          ancestors,
        };
      })
    );
    resultsWithAncestors.push(...chunkResults);
  }

  return resultsWithAncestors;
}
