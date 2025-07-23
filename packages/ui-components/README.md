# @buster/ui-components

A modern, tree-shakeable UI component library built with React, TypeScript, and Tailwind CSS 4.

## Installation

This is an internal monorepo package. It's automatically available to other packages in the workspace.

## Usage

### Components

Components must be imported from their specific paths for optimal tree-shaking:

```typescript
import { LineChart } from '@buster/ui-components/components/charts';
import { DataTable } from '@buster/ui-components/components/table';
```

### Hooks

```typescript
import { useDebounce, useSize, useMount } from '@buster/ui-components/hooks';
```

### Utilities

```typescript
import { formatNumber, formatDate, classMerge } from '@buster/ui-components/lib';
```

### Styles

Import the styles in your app's main CSS file:

```css
/* In your app.css or globals.css */
@import "@buster/ui-components/styles";
```

This includes:
- Tailwind CSS 4 with Buster's custom theme
- Component-specific styles
- Custom utilities

## Theme Customization

Override theme variables in your app:

```css
@theme {
  /* Override any Buster theme variable */
  --color-buster-primary: oklch(70% 0.25 350);
}
```

Available theme variables include:
- Colors: `--color-buster-primary`, `--color-buster-secondary`, etc.
- Typography: `--font-size-buster-lg`, `--font-size-buster-xl`, etc.
- Spacing: `--spacing-buster-md`, `--spacing-buster-lg`, etc.
- Shadows: `--shadow-buster-sm`, `--shadow-buster-md`, etc.

## Development

```bash
# Build the library
pnpm run build

# Run in watch mode
pnpm run dev

# Run tests
pnpm run test

# Type check
pnpm run typecheck
```

## Import Strategy

- **Components**: Direct imports only (no barrel exports)
- **Hooks & Utilities**: Barrel exports for convenience
- **Styles**: Single import for all styles

This approach maximizes tree-shaking for components while maintaining good DX for smaller modules.

## License

See LICENSE file in the root of the monorepo. 