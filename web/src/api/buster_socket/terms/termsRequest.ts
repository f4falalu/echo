/**
 * @fileoverview Contains request type definitions for the Terms API endpoints
 */

import { BusterSocketRequestBase } from '../base_interfaces';

/**
 * Request type for listing terms with pagination
 * @param page - The page number to retrieve
 * @param page_size - The number of items per page
 */
export type TermsListRequest = BusterSocketRequestBase<
  '/terms/list',
  {
    /** The page number to retrieve */
    page: number;
    /** The number of items per page */
    page_size: number;
  }
>;

/**
 * Request type for retrieving a specific term by ID
 * @param id - The unique identifier of the term
 */
export type TermsGetRequest = BusterSocketRequestBase<
  '/terms/get',
  {
    /** The unique identifier of the term */
    id: string;
  }
>;

/**
 * Request type for creating a new term
 * @param name - The name of the term
 * @param definition - The definition or description of the term
 * @param sql_snippet - Optional SQL snippet associated with the term
 * @param dataset_ids - Array of dataset IDs where this term should be applied
 */
export type TermPostRequest = BusterSocketRequestBase<
  '/terms/post',
  {
    /** The name of the term */
    name: string;
    /** The definition or description of the term */
    definition: string;
    /** Optional SQL snippet associated with the term */
    sql_snippet?: string;
    /** Array of dataset IDs where this term should be applied */
    dataset_ids: string[];
  }
>;

/**
 * Request type for updating an existing term
 * @param id - The unique identifier of the term to update
 * @param name - Optional new name for the term
 * @param definition - Optional new definition for the term
 * @param sql_snippet - Optional new SQL snippet for the term
 * @param add_to_dataset - Optional array of dataset IDs to add this term to
 * @param remove_from_dataset - Optional array of dataset IDs to remove this term from
 */
export type TermUpdateRequest = BusterSocketRequestBase<
  '/terms/update',
  {
    /** The unique identifier of the term to update */
    id: string;
    /** Optional new name for the term */
    name?: string;
    /** Optional new definition for the term */
    definition?: string;
    /** Optional new SQL snippet for the term */
    sql_snippet?: string;
    /** Optional array of dataset IDs to add this term to */
    add_to_dataset?: string[];
    /** Optional array of dataset IDs to remove this term from */
    remove_from_dataset?: string[];
  }
>;

/**
 * Request type for deleting terms
 * @param ids - Array of term IDs to delete
 */
export type TermDeleteRequest = BusterSocketRequestBase<
  '/terms/delete',
  {
    /** Array of term IDs to delete */
    ids: string[];
  }
>;

/**
 * Union type of all possible term-related requests
 */
export type TermsEmits =
  | TermsListRequest
  | TermsGetRequest
  | TermPostRequest
  | TermUpdateRequest
  | TermDeleteRequest;
