import { type SearchFilters, getUserOrganizationId, searchText } from '@buster/database';
import type { SearchTextData, SearchTextRequest, SearchTextResponse } from '@buster/server-shared';
import { getAssetAncestors } from './get-search-result-ancestors';

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

  if (searchRequest.query) {
    const highlightedResults = await Promise.all(
      result.data.map(async (searchResult) => {
        const highlightedText = await highlightSearchTerms(
          searchRequest.query ?? '',
          searchResult.searchableText
        );
        return {
          ...searchResult,
          searchableText: highlightedText,
        };
      })
    );
    result = {
      ...result,
      data: highlightedResults,
    };
  }

  if (searchRequest.includeAncestors) {
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
  const chunkSize = 10;
  const resultsWithAncestors: SearchTextData[] = [];

  for (let i = 0; i < searchResults.length; i += chunkSize) {
    const chunk = searchResults.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(async (searchResult) => {
        const ancestors = await getAssetAncestors(
          searchResult.assetId,
          searchResult.assetType,
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

/**
 * Highlights search terms in text by wrapping matching words with HTML <b> tags
 * @param searchString - The search query string
 * @param searchableText - The text to highlight terms in
 * @returns The text with search terms wrapped in <b> tags
 */
export async function highlightSearchTerms(
  searchString: string,
  searchableText: string
): Promise<string> {
  if (!searchString || !searchableText) {
    return searchableText;
  }

  // Split search string by spaces and filter out empty strings
  const searchTerms = searchString.split(' ').filter((term) => term.trim().length > 0);

  if (searchTerms.length === 0) {
    return searchableText;
  }

  let result = searchableText;

  // Process each search term individually to ensure all matches are replaced
  searchTerms.forEach((term) => {
    const trimmedTerm = term.trim();
    if (trimmedTerm.length === 0) return;

    const escapedTerm = trimmedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Create regex with global flag to replace ALL occurrences
    const regex = new RegExp(`\\b(${escapedTerm})\\b`, 'gi');

    // Replace all matches for this term
    result = result.replace(regex, '<b>$1</b>');
  });

  return result;
}
