'use client';

import { timeout } from './timeout';

export async function exportJSONToCSV(
  data: Record<string, string | null | Date | number>[],
  fileName: string = 'data'
) {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Get all unique headers from all rows
  const headers = Array.from(new Set(data.flatMap(Object.keys)));

  // Create CSV content
  let csvContent = headers.join(',') + '\n';

  data.forEach((row) => {
    const rowValues = headers.map((header) => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if contains comma
        const escapedValue = value.replace(/"/g, '""');
        return escapedValue.includes(',') ? `"${escapedValue}"` : escapedValue;
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      return String(value);
    });
    csvContent += rowValues.join(',') + '\n';
  });

  // Create Blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(`${fileName}.csv`, blob);
}

function downloadFile(fileName: string, data: Blob) {
  const downloadLink = document.createElement('a');
  downloadLink.download = fileName;
  const url = URL.createObjectURL(data);
  downloadLink.href = url;
  downloadLink.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    downloadLink.remove();
  }, 100);
}

export async function exportElementToImage(element: HTMLElement) {
  //@ts-ignore
  const domToImage = (await import('dom-to-image').then((m) => m.default)) as any;
  const dataUrl = (await domToImage.toPng(element)) as string;
  return dataUrl;
}

export async function downloadElementToImage(element: HTMLElement, fileName: string) {
  const imageData = await exportElementToImage(element);
  downloadImageData(imageData, fileName);
}

export async function downloadImageData(imageData: string, fileName: string) {
  const link = document.createElement('a');
  link.href = imageData;
  link.download = fileName;
  link.click();
  await timeout(1);
  link.remove();
  URL.revokeObjectURL(imageData);
}
