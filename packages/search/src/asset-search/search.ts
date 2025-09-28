import { type SearchFilters, getUserOrganizationId, searchText } from '@buster/database/queries';
import type {
  AssetType,
  SearchTextData,
  SearchTextRequest,
  SearchTextResponse,
} from '@buster/server-shared';
import { getAssetAncestors } from './get-search-result-ancestors';
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
  // Get user's organization
  const userOrg = await getUserOrganizationId(userId);

  if (!userOrg) {
    throw new Error('User is not associated with an organization');
  }

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
  let result: SearchTextResponse = await searchText({
    userId,
    searchString: searchRequest.query,
    organizationId: userOrg.organizationId,
    page: searchRequest.page,
    page_size: searchRequest.page_size,
    filters,
  });

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

  if (searchRequest.includeAssetAncestors) {
    const resultsWithAncestors = await addAncestorsToSearchResults(
      result.data,
      userId,
      userOrg.organizationId
    );

    result = {
      ...result,
      data: resultsWithAncestors,
    };
  }

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
  const chunkSize = 5;
  const resultsWithAncestors: SearchTextData[] = [];

  for (let i = 0; i < searchResults.length; i += chunkSize) {
    const chunk = searchResults.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(async (searchResult) => {
        const ancestors = await getAssetAncestors(
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
