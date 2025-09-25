import type { Table } from '@tanstack/react-table';
import { CELL_HEIGHT } from '../constants';

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

  // Get the selected range
  const range = selection.getRangeAt(0);

  // Find all selected cells by checking which td elements intersect with the selection
  const selectedCells: { rowIndex: number; columnId: string; value: string }[] = [];

  // Get all td elements within the selection range
  const walker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      if (node.nodeName === 'TD' && range.intersectsNode(node)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  });

  const visibleRows = table.getRowModel().rows;
  const selectedTdElements: HTMLTableCellElement[] = [];

  let node = walker.nextNode();
  while (node) {
    selectedTdElements.push(node as HTMLTableCellElement);
    node = walker.nextNode();
  }

  // Map selected TD elements to their row and column data
  for (const tdElement of selectedTdElements) {
    // Find the row element (tr) that contains this td
    const trElement = tdElement.closest('tr');
    if (!trElement) continue;

    // Find the row index by checking the transform translateY value
    const style = trElement.getAttribute('style');
    const translateYMatch = style?.match(/translateY\((\d+(?:\.\d+)?)px\)/);
    if (!translateYMatch) continue;

    const translateY = parseFloat(translateYMatch[1]);
    const rowIndex = Math.floor(translateY / CELL_HEIGHT);

    const row = visibleRows[rowIndex];
    if (!row) continue;

    // Find the column index by checking the position of this td within its row
    const tdElements = Array.from(trElement.querySelectorAll('td'));
    const columnIndex = tdElements.indexOf(tdElement);

    const visibleCells = row.getVisibleCells();
    const cell = visibleCells[columnIndex];

    if (cell) {
      const value = cell.getValue();
      const stringValue = value !== null && value !== undefined ? String(value) : '';

      selectedCells.push({
        rowIndex,
        columnId: cell.column.id,
        value: stringValue,
      });
    }
  }

  // If no cells were found, fall back to plain text
  if (selectedCells.length === 0) {
    return; // Let the browser handle the default copy behavior
  }

  // Group cells by row and sort by column order
  const cellsByRow = new Map<number, Map<string, string>>();
  const columnOrder = table.getAllColumns().map((col) => col.id);

  for (const cell of selectedCells) {
    if (!cellsByRow.has(cell.rowIndex)) {
      cellsByRow.set(cell.rowIndex, new Map());
    }
    const rowMap = cellsByRow.get(cell.rowIndex);
    if (rowMap) {
      rowMap.set(cell.columnId, cell.value);
    }
  }

  // Build TSV data respecting column order
  const sortedRowIndices = Array.from(cellsByRow.keys()).sort((a, b) => a - b);
  const tsvData = sortedRowIndices
    .map((rowIndex) => {
      const rowCells = cellsByRow.get(rowIndex);
      if (!rowCells) return '';

      const selectedColumnIds = Array.from(rowCells.keys());

      // Maintain column order for multi-column selections
      const orderedColumns = columnOrder.filter((colId) => selectedColumnIds.includes(colId));

      return orderedColumns.map((colId) => rowCells.get(colId) || '').join('\t');
    })
    .join('\n');

  // Build HTML table structure
  const htmlTable = `<table><tbody>${sortedRowIndices
    .map((rowIndex) => {
      const rowCells = cellsByRow.get(rowIndex);
      if (!rowCells) return '';

      const selectedColumnIds = Array.from(rowCells.keys());
      const orderedColumns = columnOrder.filter((colId) => selectedColumnIds.includes(colId));

      return `<tr>${orderedColumns
        .map((colId) => `<td>${rowCells.get(colId) || ''}</td>`)
        .join('')}</tr>`;
    })
    .join('')}</tbody></table>`;

  // Set clipboard data with both formats
  event.clipboardData?.setData('text/plain', tsvData);
  event.clipboardData?.setData('text/html', htmlTable);
  event.preventDefault();
}
