import type { Table } from '@tanstack/react-table';

export interface HandleTableCopyOptions {
  table: Table<Record<string, string | number | Date | null>>;
  parentRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Handles clipboard copy events to preserve table structure
 * @param event - The clipboard event
 * @param options - Table and container reference
 */
export function handleTableCopy(event: ClipboardEvent, options: HandleTableCopyOptions): void {
  const { table, parentRef } = options;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const container = parentRef.current;
  if (!container || !container.contains(selection.anchorNode)) {
    return;
  }

  // Check if selection is within our table
  const selectedText = selection.toString().trim();
  if (!selectedText) return;

  // Build structured table data from the current table state
  const visibleRows = table.getRowModel().rows;
  const columnOrder = table.getAllColumns().map((col) => col.id);

  // Create tab-separated values for the entire visible data
  const tsvData = visibleRows
    .map((row) =>
      columnOrder
        .map((colId) => {
          const cell = row.getVisibleCells().find((cell) => cell.column.id === colId);
          if (!cell) return '';
          const value = cell.getValue();
          return value !== null && value !== undefined ? String(value) : '';
        })
        .join('\t')
    )
    .join('\n');

  // Create HTML table structure
  const htmlTable = `<table><tbody>${visibleRows
    .map(
      (row) =>
        `<tr>${columnOrder
          .map((colId) => {
            const cell = row.getVisibleCells().find((cell) => cell.column.id === colId);
            if (!cell) return '<td></td>';
            const value = cell.getValue();
            const stringValue = value !== null && value !== undefined ? String(value) : '';
            return `<td>${stringValue}</td>`;
          })
          .join('')}</tr>`
    )
    .join('')}</tbody></table>`;

  // Set clipboard data with both formats
  event.clipboardData?.setData('text/plain', tsvData);
  event.clipboardData?.setData('text/html', htmlTable);
  event.preventDefault();
}
