# Panel Resize Component PRD

> **Last Updated**: January 2025  
> **Version**: 1.0.0  
> **Status**: Draft

## Overview

This PRD defines a flexible panel resize system consisting of three main components: `PanelGroup`, `Panel`, and `Splitter`. The system allows users to create resizable panel layouts with configurable constraints and behaviors.

## Component Architecture

### 1. PanelGroup Component

The `PanelGroup` is the parent container that manages the layout and resize behavior of its child panels.

#### Props

```typescript
interface PanelGroupProps {
  // Core Props
  children: React.ReactNode; // Must contain Panel components
  defaultLayout?: number[]; // Array of initial sizes for each panel (percentages or pixels)
  
  // Resize Configuration
  allowResize?: boolean; // Default: true. Enables/disables resize functionality
  split?: 'vertical' | 'horizontal'; // Default: 'vertical'. Direction of split
  
  // Size Constraints
  minSizes?: (number | string)[]; // Min width/height for each panel (e.g., [100, '20%', 200])
  maxSizes?: (number | string)[]; // Max width/height for each panel (e.g., [500, '80%', 400])
  
  // Preservation Settings
  preservedPanels?: number[]; // Array of panel indices that maintain pixel precision on window resize
  
  // Splitter Configuration
  hideSplitter?: boolean; // Default: false. Hides splitter but maintains resize functionality if allowResize is true
  splitterSize?: number; // Default: 4. Width/height of splitter in pixels
  
  // Styling
  className?: string; // CSS class for the container
  style?: React.CSSProperties; // Inline styles for the container
  
  // Callbacks
  onResize?: (sizes: number[]) => void; // Called when panels are resized
  onResizeStart?: () => void; // Called when resize starts
  onResizeEnd?: (sizes: number[]) => void; // Called when resize ends
}
```

#### Behavior

1. **Layout Management**:
   - Manages the overall layout direction (vertical/horizontal)
   - Calculates and maintains panel sizes
   - Handles window resize events

2. **Size Calculation**:
   - Converts between pixels and percentages
   - Enforces min/max constraints
   - Distributes available space among panels

3. **Preservation Logic**:
   - Preserved panels maintain their pixel size during window resize
   - Non-preserved panels use flex-grow to fill remaining space
   - When resizing manually, all panels respect their constraints

### 2. Panel Component

The `Panel` component represents an individual resizable panel within the PanelGroup.

#### Props

```typescript
interface PanelProps {
  // Core Props
  children: React.ReactNode; // Panel content
  id?: string; // Optional unique identifier
  
  // Size Configuration
  defaultSize?: number | string; // Initial size (overrides PanelGroup defaultLayout)
  minSize?: number | string; // Min width/height (overrides PanelGroup minSizes)
  maxSize?: number | string; // Max width/height (overrides PanelGroup maxSizes)
  
  // Behavior
  collapsible?: boolean; // Default: false. Allows panel to collapse to 0
  resizable?: boolean; // Default: true. Can be resized (overrides group setting)
  
  // Styling
  className?: string; // CSS class for the panel
  style?: React.CSSProperties; // Inline styles for the panel
  
  // Callbacks
  onResize?: (size: number) => void; // Called when this panel is resized
  onCollapse?: () => void; // Called when panel collapses
  onExpand?: () => void; // Called when panel expands from collapsed state
}
```

#### Behavior

1. **Size Management**:
   - Communicates with PanelGroup for size coordination
   - Maintains its own size state
   - Applies flex properties based on preservation settings

2. **Content Handling**:
   - Provides overflow handling (scroll, hidden, etc.)
   - Manages content visibility during collapse/expand

### 3. Splitter Component

The `Splitter` component is the draggable divider between panels.

#### Props

```typescript
interface SplitterProps {
  // Core Props
  orientation: 'vertical' | 'horizontal'; // Inherited from PanelGroup
  index: number; // Position index between panels
  
  // Behavior
  disabled?: boolean; // Disables drag functionality
  
  // Styling
  className?: string; // CSS class for the splitter
  style?: React.CSSProperties; // Inline styles for the splitter
  hoverClassName?: string; // Class applied on hover
  activeClassName?: string; // Class applied during drag
  
  // Visual
  showHandle?: boolean; // Default: true. Shows drag handle indicator
  handleClassName?: string; // Class for the handle element
}
```

#### Behavior

1. **Drag Handling**:
   - Captures mouse/touch events for dragging
   - Calculates new panel sizes during drag
   - Respects min/max constraints of adjacent panels

2. **Visual Feedback**:
   - Changes cursor on hover
   - Applies active styles during drag
   - Optional handle indicator for better affordance

## Implementation Details

### Resize Callbacks

The PanelGroup component provides three callback props for monitoring resize events:

1. **`onResizeStart`**: 
   - Fired when user begins dragging a splitter
   - Called once at the start of the resize operation
   - No parameters passed
   - Use cases: Show resize indicators, pause animations, track analytics

2. **`onResize`**: 
   - Fired continuously during resize operation
   - Called on every frame update while dragging
   - Parameters: `sizes: number[]` - Current sizes of all panels in pixels
   - Use cases: Live preview, real-time updates, size validation

3. **`onResizeEnd`**: 
   - Fired when user releases the splitter
   - Called once at the end of the resize operation
   - Parameters: `sizes: number[]` - Final sizes of all panels in pixels
   - Use cases: Save layout, trigger reflow, update persistent storage

Example usage:

```tsx
<PanelGroup
  onResizeStart={() => {
    console.log('Resize started');
    setIsResizing(true);
  }}
  onResize={(sizes) => {
    console.log('Current sizes:', sizes);
    // Could update a preview or validate sizes
  }}
  onResizeEnd={(sizes) => {
    console.log('Final sizes:', sizes);
    setIsResizing(false);
    // Save to localStorage or API
    localStorage.setItem('panelSizes', JSON.stringify(sizes));
  }}
>
  <Panel>Content 1</Panel>
  <Panel>Content 2</Panel>
  <Panel>Content 3</Panel>
</PanelGroup>
```

### Layout Structure

```tsx
<PanelGroup split="vertical" defaultLayout={[25, 50, 25]}>
  <Panel minSize={200} maxSize="40%">
    {/* Left panel content */}
  </Panel>
  
  <Splitter /> {/* Automatically inserted by PanelGroup */}
  
  <Panel>
    {/* Center panel content - flexible */}
  </Panel>
  
  <Splitter /> {/* Automatically inserted by PanelGroup */}
  
  <Panel minSize={150} preserved>
    {/* Right panel content - preserved on window resize */}
  </Panel>
</PanelGroup>
```

### Size Preservation Example

When `preservedPanels={[0, 2]}` is set:
- Panels at index 0 and 2 maintain pixel sizes on window resize
- Panel at index 1 uses `flex: 1` to fill remaining space
- During manual resize, all panels follow normal resize behavior

### Responsive Behavior

1. **Window Resize**:
   - Preserved panels: maintain pixel size
   - Non-preserved panels: adjust proportionally
   - All panels respect min/max constraints

2. **Manual Resize**:
   - User drags splitter to resize adjacent panels
   - Constraints are enforced in real-time
   - Smooth animation during resize

### CSS Structure

```css
/* PanelGroup */
.panel-group {
  display: flex;
  flex-direction: row; /* or column for horizontal split */
  width: 100%;
  height: 100%;
}

/* Panel - Preserved */
.panel-preserved {
  flex: 0 0 auto;
  width: 300px; /* Specific pixel value */
}

/* Panel - Flexible */
.panel-flexible {
  flex: 1 1 auto;
  min-width: 0; /* Allows shrinking below content size */
}

/* Splitter */
.splitter {
  flex: 0 0 auto;
  width: 4px; /* or height for horizontal */
  cursor: col-resize; /* or row-resize */
  user-select: none;
}

.splitter:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.splitter.active {
  background-color: rgba(0, 0, 0, 0.2);
}
```

## Advanced Features

### 1. Nested Panel Groups

Panel components can contain nested PanelGroups for complex layouts:

```tsx
<PanelGroup split="vertical">
  <Panel>
    <PanelGroup split="horizontal">
      <Panel>{/* Top left */}</Panel>
      <Panel>{/* Bottom left */}</Panel>
    </PanelGroup>
  </Panel>
  <Panel>{/* Right panel */}</Panel>
</PanelGroup>
```

### 2. Controlled Mode

PanelGroup can operate in controlled mode:

```tsx
const [sizes, setSizes] = useState([30, 70]);

<PanelGroup 
  sizes={sizes} 
  onResize={setSizes}
>
  {/* panels */}
</PanelGroup>
```

### 3. Persistence

Panel sizes can be persisted to localStorage:

```tsx
<PanelGroup 
  persistenceKey="myLayout"
  defaultLayout={[25, 75]}
>
  {/* panels */}
</PanelGroup>
```

### 4. Keyboard Navigation

- Arrow keys: Fine-tune panel sizes when splitter is focused
- Tab: Navigate between splitters
- Enter/Space: Toggle panel collapse (if collapsible)

## Accessibility

1. **ARIA Attributes**:
   - `role="separator"` on splitters
   - `aria-orientation` matching split direction
   - `aria-valuemin`, `aria-valuemax`, `aria-valuenow` for size

2. **Keyboard Support**:
   - Full keyboard navigation
   - Focus indicators on splitters
   - Announce size changes to screen readers

3. **Touch Support**:
   - Touch-friendly splitter targets
   - Smooth touch-based resizing
   - Gesture support for mobile devices

## Performance Considerations

1. **Debounced Callbacks**:
   - Resize callbacks are debounced during drag
   - Final callback on resize end

2. **RAF Integration**:
   - Use requestAnimationFrame for smooth resizing
   - Batch DOM updates

3. **Memoization**:
   - Memoize child components to prevent unnecessary re-renders
   - Use React.memo for Panel components

## Error Handling

1. **Invalid Configurations**:
   - Warn if min > max sizes
   - Handle missing Panel children gracefully
   - Fallback to equal distribution if defaultLayout is invalid

2. **Constraint Violations**:
   - Prevent panels from shrinking below minimum
   - Prevent panels from growing beyond maximum
   - Redistribute space when constraints conflict

## Browser Support

- Modern browsers with flexbox support
- IE11 with polyfills
- Mobile browsers with touch event support

## Future Enhancements

1. **Animation API**:
   - Smooth transitions when programmatically changing sizes
   - Collapse/expand animations

2. **Snap Points**:
   - Define specific sizes panels snap to during resize
   - Magnetic behavior near common sizes (25%, 50%, etc.)

3. **Auto-Save Layouts**:
   - Built-in persistence layer
   - Multiple saved layout presets

4. **Responsive Breakpoints**:
   - Different layouts for different screen sizes
   - Auto-collapse panels on mobile

## Success Metrics

1. **Performance**:
   - 60fps during resize operations
   - < 100ms initial render time
   - < 16ms per resize frame

2. **Usability**:
   - Intuitive drag behavior
   - Clear visual feedback
   - Accessible to all users

3. **Developer Experience**:
   - Simple API
   - Comprehensive TypeScript support
   - Minimal configuration required

## Example Implementations

### Basic Two-Panel Layout

```tsx
<PanelGroup>
  <Panel minSize={200}>
    <Sidebar />
  </Panel>
  <Panel>
    <MainContent />
  </Panel>
</PanelGroup>
```

### Complex Dashboard Layout

```tsx
<PanelGroup 
  split="horizontal" 
  defaultLayout={[60, 40]}
  preservedPanels={[1]}
>
  <Panel>
    <PanelGroup split="vertical" defaultLayout={[30, 70]}>
      <Panel minSize={250} maxSize={500}>
        <Navigation />
      </Panel>
      <Panel>
        <Editor />
      </Panel>
    </PanelGroup>
  </Panel>
  <Panel minSize={200} maxSize={600}>
    <Console />
  </Panel>
</PanelGroup>
```

### Collapsible Sidebar

```tsx
<PanelGroup allowResize>
  <Panel 
    defaultSize={300}
    minSize={50}
    collapsible
    className="sidebar"
  >
    <SidebarContent />
  </Panel>
  <Panel className="main-content">
    <MainContent />
  </Panel>
</PanelGroup>
```

## Testing Strategy

1. **Unit Tests**:
   - Size calculation logic
   - Constraint enforcement
   - Event handling

2. **Integration Tests**:
   - Resize behavior
   - Keyboard navigation
   - Touch events

3. **Visual Regression**:
   - Screenshot tests for different layouts
   - Animation smoothness
   - Responsive behavior

## Conclusion

This panel resize system provides a flexible, accessible, and performant solution for creating resizable layouts in React applications. The component API is designed to be intuitive while offering advanced features for complex use cases.