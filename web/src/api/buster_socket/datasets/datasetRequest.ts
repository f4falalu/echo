import type { BusterSocketRequestBase } from '../base_interfaces';
import type {
  DatasetListPayload,
  DatasetGetPayload,
  DatasetPostPayload,
  DatasetDeletePayload,
  DatasetUpdatePayload,
  DatasetUpdateColumnPayload
} from '../../request_interfaces/datasets/interfaces';

/**
 * Request payload for listing datasets with pagination and filtering options.
 * @interface DatasetListEmitPayload
 * @extends {BusterSocketRequestBase<'/datasets/list', ListPayload>}
 */
export type DatasetListEmitPayload = BusterSocketRequestBase<'/datasets/list', DatasetListPayload>;

/**
 * Request payload for retrieving a specific dataset by ID.
 * @interface DatasetGetEmit
 * @extends {BusterSocketRequestBase<'/datasets/get', GetPayload>}
 */
export type DatasetGetEmit = BusterSocketRequestBase<'/datasets/get', DatasetGetPayload>;

/**
 * Request payload for creating a new dataset.
 * @interface DatasetPostEmit
 * @extends {BusterSocketRequestBase<'/datasets/post', PostPayload>}
 */
export type DatasetPostEmit = BusterSocketRequestBase<'/datasets/post', DatasetPostPayload>;

/**
 * Request payload for deleting multiple datasets.
 * @interface DatasetDeleteEmit
 * @extends {BusterSocketRequestBase<'/datasets/delete', DeletePayload>}
 */
export type DatasetDeleteEmit = BusterSocketRequestBase<'/datasets/delete', DatasetDeletePayload>;

/**
 * Request payload for updating a dataset's properties.
 * @interface DatasetUpdateEmit
 * @extends {BusterSocketRequestBase<'/datasets/update', UpdatePayload>}
 */
export type DatasetUpdateEmit = BusterSocketRequestBase<'/datasets/update', DatasetUpdatePayload>;

/**
 * Request payload for updating a dataset column's properties.
 * @interface DatasetUpdateColumnEmit
 * @extends {BusterSocketRequestBase<'/datasets/column/update', UpdateColumnPayload>}
 */
export type DatasetUpdateColumnEmit = BusterSocketRequestBase<
  '/datasets/column/update',
  DatasetUpdateColumnPayload
>;

/**
 * Union type of all dataset-related socket emit types.
 * @type {DatasetEmits}
 */
export type DatasetEmits =
  | DatasetListEmitPayload
  | DatasetGetEmit
  | DatasetPostEmit
  | DatasetDeleteEmit
  | DatasetUpdateEmit
  | DatasetUpdateColumnEmit;
