/**
 * Unified type mapping utilities for all database adapters
 * Provides consistent type normalization across different database systems
 */

import { mapPostgreSQLType, getPostgreSQLSimpleType } from './postgresql';
import { mapMySQLType, getMySQLSimpleType } from './mysql';
import type { FieldMetadata } from '../base';

export * from './postgresql';
export * from './mysql';

/**
 * Database type identifiers for routing to correct mapper
 */
export type DatabaseType = 
  | 'postgresql' 
  | 'redshift' 
  | 'mysql' 
  | 'sqlserver' 
  | 'snowflake' 
  | 'bigquery';

/**
 * Simple type categories used in metadata
 */
export type SimpleType = 'number' | 'text' | 'date';

/**
 * Maps a database-specific type to a normalized type name
 * @param dbType - The database type (postgresql, mysql, etc.)
 * @param typeValue - The type value (OID, code, or name)
 * @returns Normalized type name
 */
export function mapDatabaseType(dbType: DatabaseType, typeValue: string | number): string {
  switch (dbType) {
    case 'postgresql':
    case 'redshift': // Redshift uses PostgreSQL type OIDs
      return mapPostgreSQLType(typeValue);
    
    case 'mysql':
      return mapMySQLType(typeValue);
    
    case 'sqlserver':
    case 'snowflake':
      // These already return readable type names
      return typeof typeValue === 'string' ? typeValue.toLowerCase() : 'text';
    
    case 'bigquery':
      // BigQuery types are usually already normalized
      return typeof typeValue === 'string' ? typeValue.toLowerCase() : 'text';
    
    default:
      return typeof typeValue === 'string' ? typeValue.toLowerCase() : 'text';
  }
}

/**
 * Gets the simple type category for a normalized type
 * @param dbType - The database type
 * @param normalizedType - The normalized type name
 * @returns Simple type category
 */
export function getSimpleType(dbType: DatabaseType, normalizedType: string): SimpleType {
  switch (dbType) {
    case 'postgresql':
    case 'redshift':
      return getPostgreSQLSimpleType(normalizedType);
    
    case 'mysql':
      return getMySQLSimpleType(normalizedType);
    
    case 'sqlserver':
    case 'snowflake':
    case 'bigquery':
    default:
      return getGenericSimpleType(normalizedType);
  }
}

/**
 * Generic simple type detection for databases without specific mappings
 * @param normalizedType - The normalized type name
 * @returns Simple type category
 */
export function getGenericSimpleType(normalizedType: string): SimpleType {
  const lowerType = normalizedType.toLowerCase();
  
  // Numeric types
  if (
    lowerType.includes('int') ||
    lowerType.includes('float') ||
    lowerType.includes('double') ||
    lowerType.includes('decimal') ||
    lowerType.includes('numeric') ||
    lowerType.includes('number') ||
    lowerType.includes('real') ||
    lowerType === 'money'
  ) {
    return 'number';
  }
  
  // Date/time types
  if (
    lowerType.includes('date') ||
    lowerType.includes('time') ||
    lowerType.includes('interval')
  ) {
    return 'date';
  }
  
  // Everything else is text
  return 'text';
}

/**
 * Normalizes field metadata with proper type mappings
 * @param fields - Raw field metadata from database adapter
 * @param dbType - The database type
 * @returns Normalized field metadata
 */
export function normalizeFieldMetadata(
  fields: FieldMetadata[],
  dbType: DatabaseType
): FieldMetadata[] {
  return fields.map((field) => ({
    ...field,
    type: mapDatabaseType(dbType, field.type),
  }));
}