import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useExpansion } from './use-expansion';

// Mock useInput from ink
vi.mock('ink', async () => {
  const actual = await vi.importActual('ink');
  return {
    ...actual,
    useInput: vi.fn(),
  };
});

describe('useExpansion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function TestComponent() {
    const [isExpanded, toggle] = useExpansion();
    // Store toggle for external access
    (globalThis as any).__testToggle = toggle;

    return <Text>{isExpanded ? 'expanded' : 'collapsed'}</Text>;
  }

  it('should initialize with isExpanded as false', () => {
    const { lastFrame } = render(<TestComponent />);

    expect(lastFrame()).toContain('collapsed');
  });

  it('should toggle state when toggle function is called', () => {
    const { lastFrame, rerender } = render(<TestComponent />);

    // Initial state
    expect(lastFrame()).toContain('collapsed');

    // Call toggle
    const toggle = (globalThis as any).__testToggle;
    toggle();

    // Need to rerender to see the change
    rerender(<TestComponent />);

    expect(lastFrame()).toContain('expanded');
  });

  it('should register useInput handler on mount', async () => {
    const { useInput } = await import('ink');
    render(<TestComponent />);

    expect(useInput).toHaveBeenCalled();
  });

  it('should call useInput with a handler function', async () => {
    const { useInput } = await import('ink');
    render(<TestComponent />);

    expect(useInput).toHaveBeenCalledWith(expect.any(Function));
  });
});
