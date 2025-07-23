# @buster/ui-components

A shared UI component library built with React, TypeScript, and Tailwind CSS v4. This package provides reusable components, hooks, and utilities that can be used across both the web application and server-side rendering contexts.

## Overview

This package serves as the central design system for the Buster monorepo, ensuring consistency across all applications. It includes:

- **Components**: Reusable React components with TypeScript support
- **Hooks**: Custom React hooks for common functionality
- **Utilities**: Helper functions and shared logic
- **Styles**: Tailwind CSS v4 configuration with custom theme

## Installation

Since this is a workspace package in the monorepo, it's automatically available to other packages. In your app's `package.json`:

```json
{
  "dependencies": {
    "@buster/ui-components": "workspace:*"
  }
}
```

## Usage

### Importing Components

```typescript
import { Button, Card, Input } from '@buster/ui-components/components';
```

### Importing Hooks

```typescript
import { useTheme, useDebounce } from '@buster/ui-components/hooks';
```

### Importing Utilities

```typescript
import { cn, formatDate } from '@buster/ui-components/lib';
```

### Using Tailwind Styles

The package includes Tailwind CSS v4 with custom theme configuration. Import the styles in your app:

```css
@import "@buster/ui-components/styles";
```

## Tailwind CSS v4 Configuration

This package uses Tailwind CSS v4's new `@theme` directive for configuration. Custom colors, fonts, and other design tokens are defined in the CSS file using CSS variables.

### Theme Structure

```css
@theme {
  /* Custom Colors */
  --color-primary: /* defined in styles */
  --color-secondary: /* defined in styles */
  
  /* Custom Fonts */
  --font-sans: /* defined in styles */
  
  /* Custom Spacing, etc. */
}
```

### Using Theme Values

Theme values can be used with Tailwind utility classes:

```jsx
<div className="bg-primary text-secondary font-sans">
  Content
</div>
```

## Development

### Building Components

```bash
pnpm run build
```

### Type Checking

```bash
pnpm run typecheck
```

### Testing

```bash
pnpm run test
```

## Architecture

The package is structured as follows:

```
src/
├── components/     # React components
│   ├── charts/    # Chart components
│   ├── error/     # Error handling components
│   └── ...
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
│   ├── classMerge.ts
│   ├── date.ts
│   ├── math.ts
│   └── ...
└── styles/        # Tailwind CSS configuration
    └── globals.css
```

## Best Practices

1. **Component Composition**: Build complex components by composing smaller, reusable ones
2. **Type Safety**: All components and utilities are fully typed with TypeScript
3. **Tree Shaking**: Import only what you need to keep bundle sizes small
4. **Theme Consistency**: Use theme values instead of hardcoded colors/sizes
5. **Accessibility**: Components follow WCAG guidelines

## Contributing

When adding new components:

1. Create the component in the appropriate directory
2. Export it from the component's index file
3. Add TypeScript types
4. Include unit tests
5. Update this README if needed

## License

Private - See root LICENSE file 