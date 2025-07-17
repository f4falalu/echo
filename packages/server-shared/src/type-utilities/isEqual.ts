/*
IsEqual is a type utility that checks if two types are equal.
It's used to ensure that a database type is equal to a type. Like when we have a type that is a database type and we want to ensure that it's equal to the schema we have.

RECOMMENDED USAGE (more reliable):
Instead of using IsEqual<T, U>, use variable assignments for better error messages:

// Type equality check - this will cause a compilation error if types don't match
const _organizationTypeCheck: Organization = {} as typeof organizations.$inferSelect;
const _databaseTypeCheck: typeof organizations.$inferSelect = {} as Organization;

This approach provides:
- Clearer error messages
- Better TypeScript error reporting
- More reliable type checking
*/

// Legacy type equality checker (variable assignment approach is recommended)
type StrictEqual<T, U> = (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2
  ? true
  : never;

export type IsEqual<T, U> = StrictEqual<T, U>;
