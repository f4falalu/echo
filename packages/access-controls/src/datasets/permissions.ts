import {
  type Dataset,
  getDatasetById,
  getPermissionedDatasets as getDbPermissionedDatasets,
  hasAllDatasetsAccess as hasDbAllDatasetsAccess,
  hasDatasetAccess as hasDbDatasetAccess,
} from '@buster/database/queries';
import type { DatasetAccessPath, PermissionedDataset } from '../types/dataset-permissions';
import { AccessControlError } from '../types/errors';
import {
  getCachedDatasetAccess,
  getCachedPermissionedDatasets,
  setCachedDatasetAccess,
  setCachedPermissionedDatasets,
} from './cache';

export interface DatasetListParams {
  userId: string;
  page?: number;
  pageSize?: number;
}

export interface DatasetListResult {
  datasets: PermissionedDataset[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Get all datasets a user has permission to access
 * Implements the 6 access paths from the Rust code
 */
export async function getPermissionedDatasets(
  params: DatasetListParams
): Promise<DatasetListResult> {
  const { userId, page = 0, pageSize = 20 } = params;

  // Check cache first
  const cached = getCachedPermissionedDatasets(userId, page, pageSize);
  if (cached !== undefined) {
    return {
      ...cached,
      page,
      pageSize,
    };
  }

  try {
    const result = await getDbPermissionedDatasets({
      userId,
      page,
      pageSize,
    });

    // Cache the result
    setCachedPermissionedDatasets(userId, page, pageSize, result);

    return {
      datasets: result.datasets,
      total: result.total,
      page,
      pageSize,
    };
  } catch (error) {
    throw new AccessControlError('database_error', 'Failed to get permissioned datasets', {
      error,
    });
  }
}

export interface DatasetAccessCheck {
  userId: string;
  datasetId: string;
}

export interface DatasetAccessResult {
  hasAccess: boolean;
  accessPath?: DatasetAccessPath;
  userRole?: string;
}

/**
 * Check if a user has access to a specific dataset
 */
export async function checkDatasetAccess(params: DatasetAccessCheck): Promise<DatasetAccessResult> {
  const { userId, datasetId } = params;

  // Check cache first
  const cached = getCachedDatasetAccess(userId, datasetId);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const result = await hasDbDatasetAccess(userId, datasetId);

    // Cache the full result
    const cacheResult = {
      hasAccess: result.hasAccess,
      ...(result.accessPath !== undefined && { accessPath: result.accessPath }),
      ...(result.userRole !== undefined && { userRole: result.userRole }),
    };
    setCachedDatasetAccess(userId, datasetId, cacheResult);

    const returnResult: DatasetAccessResult = {
      hasAccess: result.hasAccess,
    };
    if (result.accessPath !== undefined) {
      returnResult.accessPath = result.accessPath;
    }
    if (result.userRole !== undefined) {
      returnResult.userRole = result.userRole;
    }
    return returnResult;
  } catch (error) {
    throw new AccessControlError('database_error', 'Failed to check dataset access', { error });
  }
}

export interface MultiDatasetAccessCheck {
  userId: string;
  datasetIds: string[];
}

export interface MultiDatasetAccessResult {
  hasAccessToAll: boolean;
  details: Record<string, DatasetAccessResult>;
}

/**
 * Check if a user has access to multiple datasets
 */
export async function checkMultipleDatasetAccess(
  params: MultiDatasetAccessCheck
): Promise<MultiDatasetAccessResult> {
  const { userId, datasetIds } = params;

  if (datasetIds.length === 0) {
    return {
      hasAccessToAll: false,
      details: {},
    };
  }

  try {
    const result = await hasDbAllDatasetsAccess(userId, datasetIds);

    // Convert the database result to our format
    const details: Record<string, DatasetAccessResult> = {};

    for (const [datasetId, accessResult] of Object.entries(result.details)) {
      const detail: DatasetAccessResult = {
        hasAccess: accessResult.hasAccess,
      };
      if (accessResult.accessPath !== undefined) {
        detail.accessPath = accessResult.accessPath;
      }
      if (accessResult.userRole !== undefined) {
        detail.userRole = accessResult.userRole;
      }
      details[datasetId] = detail;
    }

    return {
      hasAccessToAll: result.hasAccessToAll,
      details,
    };
  } catch (error) {
    throw new AccessControlError('database_error', 'Failed to check multiple dataset access', {
      error,
    });
  }
}

/**
 * Helper to check if user has admin access to datasets
 */
export function isDatasetAdmin(userRole?: string): boolean {
  return userRole === 'workspace_admin' || userRole === 'data_admin' || userRole === 'querier';
}

export interface EnsureDatasetAccessParams {
  userId: string;
  datasetId: string;
}

/**
 * Ensures a user has access to a dataset by:
 * 1. Fetching the dataset from the database
 * 2. Checking if the dataset exists (throws not_found error if not)
 * 3. Checking if the user has access (throws forbidden error if not)
 * 4. Returning the dataset if all checks pass
 *
 * This consolidates the common pattern of fetching and checking dataset access
 * used across multiple endpoints.
 *
 * @param params - The user ID and dataset ID to check
 * @returns The dataset if the user has access
 * @throws AccessControlError with code 'not_found' if dataset doesn't exist
 * @throws AccessControlError with code 'forbidden' if user doesn't have access
 */
export async function ensureDatasetAccess(params: EnsureDatasetAccessParams): Promise<Dataset> {
  const { userId, datasetId } = params;

  // Fetch the dataset from database
  const dataset = await getDatasetById({ datasetId });

  // Check if dataset exists
  if (!dataset) {
    throw new AccessControlError('dataset_not_found', 'Dataset not found');
  }

  // Check user has access to the dataset
  const accessResult = await checkDatasetAccess({
    userId,
    datasetId,
  });

  if (!accessResult.hasAccess) {
    throw new AccessControlError(
      'permission_denied',
      'You do not have permission to access this dataset'
    );
  }

  // Return the dataset if all checks pass
  return dataset;
}
