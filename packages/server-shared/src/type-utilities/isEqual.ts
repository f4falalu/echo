/**
 * Macro for creating type equality checks. Copy this pattern and replace T and U:
 *
 * @example
 * // Copy and paste this pattern, replacing YourType and YourDatabaseType:
 * const _typeCheck1: YourType = {} as YourDatabaseType;
 * const _typeCheck2: YourDatabaseType = {} as YourType;
 *
 * // Or use the type utility version:
 * type _TypeCheck = Expect<Equal<YourType, YourDatabaseType>>;
 */

/**
 * Precise type equality checker using conditional types with function signatures.
 * This is the most reliable method for checking exact type equality.
 *
 * @example
 * type _EqualityCheck = Expect<Equal<MyType, DatabaseType>>;
 */
export type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
  ? (<T>() => T extends B ? 1 : 2) extends <T>() => T extends A ? 1 : 2
    ? true
    : false
  : false;

/**
 * Compile-time assertion: T must be `true`, otherwise TypeScript errors.
 * Use this with Equal<> to force compilation errors when types don't match.
 *
 * @example
 * type _Check = Expect<Equal<MyType, DatabaseType>>; // Errors if types don't match exactly
 */
export type Expect<T extends true> = T;
