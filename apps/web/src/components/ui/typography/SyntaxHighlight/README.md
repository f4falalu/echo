# SyntaxHighlighter Component

A high-performance syntax highlighting component built with [Shiki](https://shiki.matsu.io/) for React applications. Features include theme support, line numbers, caching, and a singleton pattern for optimal performance.

## Features

- 🎨 **Light & Dark themes** - GitHub Light and GitHub Dark themes
- 🔢 **Line numbers** - Optional line numbers with customizable starting point
- ⚡ **Performance optimized** - Singleton instance shared across all components
- 💾 **Result caching** - Highlighted code is cached to avoid reprocessing
- 🌐 **Language support** - SQL and YAML (easily extensible)
- 🎯 **No loading flicker** - Shows raw code immediately, then enhances with highlighting
- 📦 **Zero config** - Works out of the box with smart defaults

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
```

## Props

| Prop                       | Type                  | Default  | Description                                        |
| -------------------------- | --------------------- | -------- | -------------------------------------------------- |
| `children`                 | `string`              | required | The code content to highlight                      |
| `language`                 | `'sql' \| 'yaml'`     | `'sql'`  | Programming language for syntax highlighting       |
| `isDarkMode`               | `boolean`             | `false`  | Whether to use dark theme                          |
| `showLineNumbers`          | `boolean`             | `false`  | Whether to show line numbers                       |
| `startingLineNumber`       | `number`              | `1`      | Starting line number (when line numbers are shown) |
| `className`                | `string`              | `''`     | Additional CSS classes for the container           |
| `customStyle`              | `React.CSSProperties` | `{}`     | Custom inline styles for the container             |
| `lineNumberStyle`          | `React.CSSProperties` | `{}`     | Custom styles for line numbers                     |
| `lineNumberContainerStyle` | `React.CSSProperties` | `{}`     | Custom styles for line number container            |

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

### YAML Configuration

```tsx
<SyntaxHighlighter language="yaml" showLineNumbers>
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
  customStyle={{
    backgroundColor: '#1a1a1a',
    padding: '20px'
  }}
  lineNumberStyle={{
    fontWeight: 'bold',
    opacity: 0.7
  }}>
  {codeContent}
</SyntaxHighlighter>
```

## Advanced Usage

### With Provider (Optional)

For better performance when using many syntax highlighters, you can wrap your app with the provider to pre-initialize the highlighter:

```tsx
// In your app root
import { SyntaxHighlightProvider } from '@/components/ui/typography/SyntaxHighlight';

function App() {
  return <SyntaxHighlightProvider>{/* Your app content */}</SyntaxHighlightProvider>;
}
```

### Using the Hook (with Provider)

```tsx
import { useSyntaxHighlight } from '@/components/ui/typography/SyntaxHighlight';

function MyComponent() {
  const { isReady, error } = useSyntaxHighlight();

  if (error) {
    console.error('Syntax highlighter failed to initialize:', error);
  }

  return <div>Highlighter ready: {isReady ? 'Yes' : 'No'}</div>;
}
```

## Performance

### Singleton Pattern

All `SyntaxHighlighter` components share a single highlighter instance, reducing memory usage and initialization time.

### Caching

Highlighted code is cached based on content, language, and theme. Identical code blocks render instantly after the first highlight.

### No Loading States

The component shows raw code immediately and updates to highlighted code seamlessly, preventing layout shifts and flicker.

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

1. **Props** - `className`, `customStyle`, `lineNumberStyle`
2. **CSS Variables** - Component respects CSS variables for theming
3. **Wrapper Styles** - Apply styles to parent containers

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
├── shiki-instance.ts            # Singleton highlighter manager
├── SyntaxHighlightProvider.tsx  # Optional React context provider
├── SyntaxHighlighter.module.css # Component styles
├── shiki-dark-theme.ts          # Custom dark theme (if needed)
└── index.ts                     # Exports
```

## Browser Support

- Modern browsers with ES2015+ support
- WebAssembly support required for syntax highlighting engine
- Graceful fallback to raw code display if initialization fails

## Troubleshooting

### Highlighter not working

- Check browser console for errors
- Ensure WebAssembly is supported and enabled
- Verify the code content is a valid string

### Performance issues

- Use the `SyntaxHighlightProvider` at app root
- Ensure you're not recreating code strings on every render
- Consider memoizing components that use syntax highlighting

### Styling issues

- Check for conflicting global styles on `pre` or `code` elements
- Ensure CSS modules are properly configured in your build setup
- Use `customStyle` prop for quick fixes

## License

This component is part of the internal UI library and follows the project's licensing terms.
