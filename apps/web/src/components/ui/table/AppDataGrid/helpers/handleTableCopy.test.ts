import type { Cell, Column, Row, Table } from '@tanstack/react-table';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type HandleTableCopyOptions, handleTableCopy } from './handleTableCopy';

// Mock the global window.getSelection
const mockSelection = {
  rangeCount: 0,
  anchorNode: null,
  toString: vi.fn(),
  getRangeAt: vi.fn(),
};

Object.defineProperty(window, 'getSelection', {
  value: vi.fn(() => mockSelection),
  writable: true,
});

// Create mock table data
const createMockCell = (value: any, columnId: string): Cell<any, any> =>
  ({
    getValue: vi.fn(() => value),
    column: { id: columnId } as Column<any, any>,
    getContext: vi.fn(),
  }) as any;

const createMockRow = (data: Record<string, any>): Row<any> =>
  ({
    getVisibleCells: vi.fn(() =>
      Object.entries(data).map(([key, value]) => createMockCell(value, key))
    ),
  }) as any;

const createMockTable = (rows: Row<any>[], columns: string[]): Table<any> =>
  ({
    getRowModel: vi.fn(() => ({ rows })),
    getAllColumns: vi.fn(() => columns.map((id) => ({ id }) as Column<any, any>)),
  }) as any;

describe('handleTableCopy', () => {
  let mockEvent: ClipboardEvent;
  let mockContainer: HTMLDivElement;
  let mockParentRef: React.RefObject<HTMLDivElement>;
  let options: HandleTableCopyOptions;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContainer = document.createElement('div');
    mockParentRef = { current: mockContainer };

    mockEvent = {
      clipboardData: {
        setData: vi.fn(),
      },
      preventDefault: vi.fn(),
    } as any;

    // Reset selection mock
    mockSelection.rangeCount = 1;
    mockSelection.anchorNode = mockContainer as any;
    mockSelection.toString = vi.fn(() => 'selected text');
  });

  it('should handle basic table data with mixed types', () => {
    const rows = [
      createMockRow({ name: 'John', age: 25, active: true }),
      createMockRow({ name: 'Jane', age: 30, active: false }),
    ];
    const table = createMockTable(rows, ['name', 'age', 'active']);

    options = { table, parentRef: mockParentRef };

    handleTableCopy(mockEvent, options);

    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith(
      'text/plain',
      'John\t25\ttrue\nJane\t30\tfalse'
    );
    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith(
      'text/html',
      '<table><tbody><tr><td>John</td><td>25</td><td>true</td></tr><tr><td>Jane</td><td>30</td><td>false</td></tr></tbody></table>'
    );
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should preserve zero values and not replace them with empty strings', () => {
    const rows = [
      createMockRow({ count: 0, percentage: 0.0, balance: 0 }),
      createMockRow({ count: 1, percentage: 5.5, balance: 100 }),
    ];
    const table = createMockTable(rows, ['count', 'percentage', 'balance']);

    options = { table, parentRef: mockParentRef };

    handleTableCopy(mockEvent, options);

    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith(
      'text/plain',
      '0\t0\t0\n1\t5.5\t100'
    );
    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith(
      'text/html',
      '<table><tbody><tr><td>0</td><td>0</td><td>0</td></tr><tr><td>1</td><td>5.5</td><td>100</td></tr></tbody></table>'
    );
  });

  it('should handle null and undefined values correctly', () => {
    const rows = [
      createMockRow({ name: 'John', score: null, notes: undefined }),
      createMockRow({ name: 'Jane', score: 95, notes: 'Great work' }),
    ];
    const table = createMockTable(rows, ['name', 'score', 'notes']);

    options = { table, parentRef: mockParentRef };

    handleTableCopy(mockEvent, options);

    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith(
      'text/plain',
      'John\t\t\nJane\t95\tGreat work'
    );
    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith(
      'text/html',
      '<table><tbody><tr><td>John</td><td></td><td></td></tr><tr><td>Jane</td><td>95</td><td>Great work</td></tr></tbody></table>'
    );
  });

  it('should return early when no selection exists', () => {
    mockSelection.rangeCount = 0;

    const table = createMockTable([], []);
    options = { table, parentRef: mockParentRef };

    handleTableCopy(mockEvent, options);

    expect(mockEvent.clipboardData!.setData).not.toHaveBeenCalled();
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('should return early when selection is not within the table container', () => {
    const outsideElement = document.createElement('div');
    mockSelection.anchorNode = outsideElement as any;

    const table = createMockTable([], []);
    options = { table, parentRef: mockParentRef };

    handleTableCopy(mockEvent, options);

    expect(mockEvent.clipboardData!.setData).not.toHaveBeenCalled();
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });
});
