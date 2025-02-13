/**
 * @fileoverview Contains request type definitions for the Terms API endpoints
 */

import { BusterSocketRequestBase } from '../base_interfaces';
import {
  TermsListParams,
  TermsGetParams,
  TermPostParams,
  TermUpdateParams,
  TermDeleteParams
} from '../../request_interfaces/terms/interfaces';

/**
 * Request type for listing terms with pagination
 */
export type TermsListRequest = BusterSocketRequestBase<'/terms/list', TermsListParams>;

/**
 * Request type for retrieving a specific term by ID
 */
export type TermsGetRequest = BusterSocketRequestBase<'/terms/get', TermsGetParams>;

/**
 * Request type for creating a new term
 */
export type TermPostRequest = BusterSocketRequestBase<'/terms/post', TermPostParams>;

/**
 * Request type for updating an existing term
 */
export type TermUpdateRequest = BusterSocketRequestBase<'/terms/update', TermUpdateParams>;

/**
 * Request type for deleting terms
 */
export type TermDeleteRequest = BusterSocketRequestBase<'/terms/delete', TermDeleteParams>;

/**
 * Union type of all possible term-related requests
 */
export type TermsEmits =
  | TermsListRequest
  | TermsGetRequest
  | TermPostRequest
  | TermUpdateRequest
  | TermDeleteRequest;
