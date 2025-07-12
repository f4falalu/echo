/*
IsEqual is a type utility that checks if two types are equal.
It's used to ensure that a database type is equal to a type. Like when we have a type that is a database type and we want to ensure that it's equal to the schema we have.

Example:
type _DBEqualityCheck = IsEqual<Organization, typeof organizations.$inferSelect>; // This will cause a compile error if Organization and organizations.$inferSelect don't match.

This will cause a compile error if Organization and OrganizationDB don't match.
*/
export type IsEqual<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
