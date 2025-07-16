import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InputSearchDropdown } from './InputSearchDropdown';

// Mock the hooks
vi.mock('@/hooks', () => ({
  useMemoizedFn: (fn: any) => fn
}));

// Mock the classMerge utility
vi.mock('@/lib/classMerge', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' ')
}));

describe('InputSearchDropdown', () => {
  const mockOptions = [
    { label: 'Option 1', value: 'option1' },
    { label: 'Option 2', value: 'option2' },
    { label: 'Option 3', value: 'option3' }
  ];

  const defaultProps = {
    options: mockOptions,
    onSelect: vi.fn(),
    onSearch: vi.fn(),
    value: '',
    placeholder: 'Search...'
  };

  it('renders input field with placeholder', () => {
    render(<InputSearchDropdown {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeInTheDocument();
  });

  it('shows dropdown when user starts typing', async () => {
    render(<InputSearchDropdown {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(() => {
      expect(defaultProps.onSearch).toHaveBeenCalledWith('test');
    });
  });

  it('hides dropdown when input is empty', () => {
    render(<InputSearchDropdown {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: '' } });

    // Dropdown should not be visible when input is empty
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('calls onSelect when an option is clicked', async () => {
    render(<InputSearchDropdown {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'test' } });

    // Wait for dropdown to appear and click an option
    await waitFor(() => {
      const option = screen.getByText('Option 1');
      fireEvent.click(option);
    });

    expect(defaultProps.onSelect).toHaveBeenCalledWith('option1');
  });

  it('updates input value when value prop changes', () => {
    const { rerender } = render(<InputSearchDropdown {...defaultProps} />);

    rerender(<InputSearchDropdown {...defaultProps} value="new value" />);

    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    expect(input.value).toBe('new value');
  });

  it('applies custom className', () => {
    render(<InputSearchDropdown {...defaultProps} className="custom-class" />);

    const input = screen.getByPlaceholderText('Search...');
    expect(input).toHaveClass('custom-class');
  });
});
