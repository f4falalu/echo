import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useIsTouchDevice } from './useIsTouchDevice';

// Mock window.matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia
});

describe('useIsTouchDevice', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Reset navigator properties
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      value: 0
    });

    // Reset window properties
    delete (window as any).ontouchstart;
  });

  it('should return true when device has touch support via ontouchstart', () => {
    // Test case: Device supports touch via ontouchstart property
    // Expected output: true
    Object.defineProperty(window, 'ontouchstart', {
      value: null,
      writable: true
    });

    mockMatchMedia.mockReturnValue({ matches: false });

    const { result } = renderHook(() => useIsTouchDevice());

    expect(result.current).toBe(true);
  });

  it('should return true when device has maxTouchPoints > 0', () => {
    // Test case: Device supports touch via navigator.maxTouchPoints
    // Expected output: true
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      value: 1
    });

    mockMatchMedia.mockReturnValue({ matches: false });

    const { result } = renderHook(() => useIsTouchDevice());

    expect(result.current).toBe(true);
  });

  it('should return true when media query matches coarse pointer', () => {
    // Test case: Device supports touch via pointer: coarse media query
    // Expected output: true
    mockMatchMedia.mockReturnValue({ matches: true });

    const { result } = renderHook(() => useIsTouchDevice());

    expect(result.current).toBe(true);
    expect(mockMatchMedia).toHaveBeenCalledWith('(pointer: coarse)');
  });

  it('should return false when no touch support is detected', () => {
    // Test case: Device has no touch support detected by any method
    // Expected output: false
    mockMatchMedia.mockReturnValue({ matches: false });

    const { result } = renderHook(() => useIsTouchDevice());

    expect(result.current).toBe(false);
  });

  it('should handle missing matchMedia gracefully', () => {
    // Test case: Browser doesn't support matchMedia (older browsers)
    // Expected output: false (no touch support detected)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: undefined
    });

    const { result } = renderHook(() => useIsTouchDevice());

    expect(result.current).toBe(false);
  });
});
