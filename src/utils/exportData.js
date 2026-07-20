import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

/**
 * Export an array of objects as a CSV file.
 * @param {Object[]} data - Array of objects to export
 * @param {string} filename - Filename without extension
 */
export function exportToCSV(data, filename = 'export') {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h] ?? '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str}"`
          : str;
      }).join(',')
    ),
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
}

/**
 * Export a DOM element as a PNG image.
 * @param {HTMLElement} element - The DOM element to capture
 * @param {string} filename - Filename without extension
 */
export async function exportToPNG(element, filename = 'chart') {
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#0a0a0a',
      scale: 2,
      useCORS: true,
    });
    canvas.toBlob((blob) => {
      if (blob) saveAs(blob, `${filename}.png`);
    });
  } catch (err) {
    console.error('Error exporting to PNG:', err);
  }
}
