/**
 * @fileoverview Contains parameter type definitions for Terms API requests
 */

/**
 * Parameters for listing terms with pagination
 */
export interface TermsListParams {
  /** The page number to retrieve */
  page: number;
  /** The number of items per page */
  page_size: number;
}

/**
 * Parameters for retrieving a specific term by ID
 */
export interface TermsGetParams {
  /** The unique identifier of the term */
  id: string;
}

/**
 * Parameters for creating a new term
 */
export interface TermPostParams {
  /** The name of the term */
  name: string;
  /** The definition or description of the term */
  definition: string;
  /** Optional SQL snippet associated with the term */
  sql_snippet?: string;
  /** Array of dataset IDs where this term should be applied */
  dataset_ids: string[];
}

/**
 * Parameters for updating an existing term
 */
export interface TermUpdateParams {
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

/**
 * Parameters for deleting terms
 */
export interface TermDeleteParams {
  /** Array of term IDs to delete */
  ids: string[];
}
