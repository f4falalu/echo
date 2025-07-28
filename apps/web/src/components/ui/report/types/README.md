# Plate.js Global Type Safety

This directory contains type definitions that extend Plate.js's `TElement` type globally, ensuring type safety throughout your application.

## How It Works

The `plate-types.d.ts` file uses TypeScript's module augmentation to extend the platejs module:

```typescript
declare module 'platejs' {
  // Extend TElement to be a union of our custom elements
  interface TElement extends TReportElement {}

  // Make Value type-safe by default
  interface Value extends Array<TReportDescendant> {}
}
```

This means that anywhere in your application where you import `TElement` or `Value` from platejs, TypeScript will enforce that only our defined element types are allowed.

## Supported Element Types

- **Headings**: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- **Text**: `p` (paragraph), `blockquote`
- **Code**: `code_block` (with optional `lang` property)
- **Lists**: `ul`, `ol`, `li` (with optional `checked` for task lists)
- **Tables**: `table`, `tr`, `td`, `th`
- **Special**: `callout` (with variants), `emoji`, `hr`
- **Layout**: `column`, `column_group`

## Usage Examples

### Type-Safe Value Creation

```typescript
import type { StrictValue } from './plate-types';
import type { Value } from 'platejs';

// Create a strictly typed value
const content = [
  {
    type: 'h1',
    children: [{ text: 'Title' }]
  },
  {
    type: 'p',
    children: [{ text: 'Paragraph' }]
  }
  // This would cause a TypeScript error:
  // {
  //   type: 'invalid-type', // Error!
  //   children: [{ text: 'Invalid' }]
  // }
] satisfies StrictValue;

// Cast to Value for use with Plate.js
const plateValue = content as Value;
```

### Using with Components

```typescript
import { AppReport } from '../AppReport';

// The value prop will be type-checked
<AppReport
  value={[
    { type: 'h1', children: [{ text: 'Hello' }] },
    // TypeScript will error on invalid types
  ]}
/>
```

### Type Narrowing

Because we're using a discriminated union, TypeScript can narrow types based on the `type` property:

```typescript
import type { TReportElement } from './plate-types';

function handleElement(element: TReportElement) {
  switch (element.type) {
    case 'callout':
      // TypeScript knows element has variant property
      console.log(element.variant);
      break;
    case 'code_block':
      // TypeScript knows element has lang property
      console.log(element.lang || 'plaintext');
      break;
  }
}
```

## Benefits

1. **Compile-time Safety**: Invalid element types are caught during development
2. **IntelliSense**: Full autocomplete for element types and their properties
3. **Type Narrowing**: TypeScript understands the relationship between element types and their properties
4. **Global Enforcement**: Type safety is enforced everywhere platejs types are used

## Notes

- The module augmentation affects the entire project, so all platejs imports will use our strict types
- If you need to add new element types, update the interfaces in `plate-types.d.ts`
- For backwards compatibility, you can still cast to `Value` when needed
