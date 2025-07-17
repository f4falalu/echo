# Schema Types

This directory contains TypeScript types for JSONB columns in the database.

## Purpose

JSONB columns in PostgreSQL are flexible but lack compile-time type safety. This directory provides:
- **TypeScript types** for compile-time type safety
- **Organized structure** for maintaining complex JSON data types

## Usage

### Adding New Types

1. **Create a new file** for your entity (e.g., `dashboard.ts`, `user.ts`)
2. **Define TypeScript types**:

```typescript
// TypeScript type for compile-time safety
export type DashboardConfig = {
  theme: 'light' | 'dark';
  layout: string;
  widgets: Array<{ id: string; type: string }>;
};
```

3. **Export from index.ts**:
```typescript
export * from './dashboard';
```

4. **Use in schema.ts** with type-safe JSONB:
```typescript
import type { DashboardConfig } from './schema-types';

export const dashboards = pgTable('dashboards', {
  // ... other columns
  config: jsonb('config').$type<DashboardConfig>().default(sql`'{}'::jsonb`).notNull(),
});
```

### Using the Types

**Type-safe database operations:**
```typescript
// TypeScript knows the exact structure
const dashboard = await db.select().from(dashboards).where(eq(dashboards.id, id));
const config: DashboardConfig = dashboard[0].config;

// Full autocomplete and type checking
console.log(config.theme); // ✅ 'light' | 'dark'
console.log(config.widgets); // ✅ Array<{ id: string; type: string }>
```

## File Organization

- **One file per logical entity** (organization, dashboard, user, etc.)
- **Clear naming conventions** using camelCase for types
- **Consistent exports** through the main index.ts file

## Benefits

- 🛡️ **Type Safety**: Compile-time checks prevent runtime errors
- 🔍 **IntelliSense**: Full autocomplete support in IDEs
- 📚 **Documentation**: Self-documenting types
- 🔧 **Maintainable**: Organized structure for complex JSON data types

## Examples

See `organization.ts` for a complete example of the pattern with organization color palettes. 