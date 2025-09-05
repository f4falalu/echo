# SyntaxHighlighter Component

A high-performance syntax highlighting component built with [Shiki](https://shiki.matsu.io/) for React applications. Features include theme support, line numbers, animations, intelligent fallback rendering, and a custom hook for optimal performance.

## Features

- 🎨 **Light & Dark themes** - GitHub Light and GitHub Dark themes
- 🔢 **Line numbers** - Optional line numbers with customizable starting point
- ⚡ **Performance optimized** - Custom hook with efficient token loading
- 💾 **Result caching** - Highlighted code is cached to avoid reprocessing
- 🌐 **Language support** - SQL and YAML (easily extensible)
- 🎯 **Smart fallback** - Shows styled fallback immediately while tokens load
- ✨ **Animations** - Built-in animation support for code reveal effects
- 📦 **Zero config** - Works out of the box with smart defaults
- 🎮 **Debug mode** - Press 'l' key to toggle between highlighted and fallback view

## Basic Usage

```tsx
import { SyntaxHighlighter } from '@/components/ui/typography/SyntaxHighlight';

// Simple SQL highlighting
<SyntaxHighlighter language="sql">
  SELECT * FROM users WHERE active = true;
</SyntaxHighlighter>

// YAML with dark theme
<SyntaxHighlighter language="yaml" isDarkMode>
  name: my-app
  version: 1.0.0
</SyntaxHighlighter>

// With line numbers
<SyntaxHighlighter
  language="sql"
  showLineNumbers
  startingLineNumber={10}
>
  {sqlCode}
</SyntaxHighlighter>

// With animation
<SyntaxHighlighter
  language="sql"
  animation="fadeIn"
  animationDuration={500}
>
  {sqlCode}
</SyntaxHighlighter>
```

## Props

| Prop                 | Type                | Default  | Description                                        |
| -------------------- | ------------------- | -------- | -------------------------------------------------- |
| `children`           | `string`            | required | The code content to highlight                      |
| `language`           | `'sql' \| 'yaml'`   | `'sql'`  | Programming language for syntax highlighting       |
| `isDarkMode`         | `boolean`           | `false`  | Whether to use dark theme                          |
| `showLineNumbers`    | `boolean`           | `false`  | Whether to show line numbers                       |
| `startingLineNumber` | `number`            | `1`      | Starting line number (when line numbers are shown) |
| `className`          | `string`            | `''`     | Additional CSS classes for the wrapper             |
| `animation`          | `MarkdownAnimation` | `'none'` | Animation type for code reveal                     |
| `animationDuration`  | `number`            | `700`    | Animation duration in milliseconds                 |

## Examples

### Basic SQL Query

```tsx
<SyntaxHighlighter language="sql">
  SELECT
    users.id,
    users.email,
    COUNT(orders.id) as order_count
  FROM users
  LEFT JOIN orders ON users.id = orders.user_id
  GROUP BY users.id, users.email
  HAVING COUNT(orders.id) > 0
  ORDER BY order_count DESC;
</SyntaxHighlighter>
```

### YAML Configuration with Animation

```tsx
<SyntaxHighlighter language="yaml" showLineNumbers animation="slideIn" animationDuration={500}>
  database: host: localhost port: 5432 name: myapp_db pool: min: 5 max: 20
</SyntaxHighlighter>
```

### Dark Mode with Custom Styling

```tsx
<SyntaxHighlighter
  language="sql"
  isDarkMode
  showLineNumbers
  className="rounded-lg shadow-lg"
  animation="fadeIn">
  {codeContent}
</SyntaxHighlighter>
```

## Advanced Usage

### Using the Hook Directly

For custom implementations, you can use the `useCodeTokens` hook:

```tsx
import { useCodeTokens } from '@/components/ui/typography/SyntaxHighlight/useCodeTokens';

function CustomHighlighter({ code, language, isDarkMode }) {
  const { tokens, isLoading } = useCodeTokens(code, language, isDarkMode);

  if (isLoading || !tokens) {
    return <div>Loading...</div>;
  }

  // Custom rendering logic
  return (
    <div style={{ background: tokens.bg, color: tokens.fg }}>{/* Custom implementation */}</div>
  );
}
```

## Performance

### Smart Token Loading

The component uses a custom `useCodeTokens` hook that:

- Loads tokens asynchronously without blocking the UI
- Prevents memory leaks with proper cleanup
- Shows styled fallback content immediately

### Fallback Rendering

While tokens are loading, the component displays a styled fallback that:

- Preserves line structure
- Applies theme-appropriate colors
- Maintains consistent layout to prevent shifts

### Animation Support

Animations are applied per-line for smooth code reveal effects:

- Minimal performance impact
- Configurable duration
- Multiple animation types available

## Adding More Languages

To add support for more languages, modify `shiki-instance.ts`:

```typescript
// Add the language import
langs: [
  () => import('@shikijs/langs/sql'),
  () => import('@shikijs/langs/yaml'),
  () => import('@shikijs/langs/javascript') // New language
];
```

Then update the component's TypeScript types:

```typescript
language?: 'sql' | 'yaml' | 'javascript';
```

## Styling

The component uses CSS modules for encapsulated styling. You can customize appearance through:

1. **Props** - `className` for wrapper styles
2. **CSS Variables** - Component respects CSS variables for theming
3. **Theme Colors** - Automatically adapts to light/dark mode

### Example with Tailwind

```tsx
<div className="my-8">
  <SyntaxHighlighter
    language="sql"
    className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
    {code}
  </SyntaxHighlighter>
</div>
```

## Architecture

```
SyntaxHighlight/
├── SyntaxHighlighter.tsx         # Main component
├── useCodeTokens.ts             # Custom hook for token loading
├── shiki-instance.ts            # Shiki instance manager & utilities
├── SyntaxHighlighter.module.css # Component styles
├── animation-common.ts          # Animation definitions
└── index.ts                     # Exports
```

### Component Structure

The main component is composed of several sub-components:

- **`SyntaxWrapper`** - Handles the outer container and styling
- **`Line`** - Renders individual lines with animation support
- **`SyntaxFallback`** - Provides styled fallback while tokens load

## Browser Support

- Modern browsers with ES2015+ support
- WebAssembly support required for syntax highlighting engine
- Graceful fallback to styled code display if initialization fails

## Troubleshooting

### Highlighter not working

- Check browser console for errors
- Ensure WebAssembly is supported and enabled
- Verify the code content is a valid string
- Try toggling debug mode with 'l' key to see fallback behavior

### Performance issues

- Consider using fewer syntax highlighters on a single page
- Ensure you're not recreating code strings on every render
- Use React.memo() on parent components if needed

### Styling issues

- Check for conflicting global styles on `pre` or `code` elements
- Ensure CSS modules are properly configured in your build setup
- Verify the `className` prop is being applied correctly

## Debug Mode

Press the 'l' key while the component is rendered to toggle between the highlighted view and the fallback view. This is useful for:

- Testing fallback appearance
- Debugging rendering issues
- Comparing performance

## License

This component is part of the internal UI library and follows the project's licensing terms.
