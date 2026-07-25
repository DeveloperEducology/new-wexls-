/**
 * CSV & Google Sheets Import/Export Service Module
 */

export function parseCsvText(csvText) {
  if (!csvText || !csvText.trim()) return { columns: [], rows: [] };
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return { columns: [], rows: [] };

  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const rowObj = { _level: 'l1' };
    headers.forEach((h, idx) => {
      if (h) {
        rowObj[h] = values[idx] !== undefined ? values[idx] : '';
      }
    });
    rows.push(rowObj);
  }

  return { columns: headers, rows };
}

export function exportToCsvString(columns, rows) {
  if (!columns || columns.length === 0) return '';
  const escapeCsv = (val) => {
    const str = String(val || '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = columns.map(escapeCsv).join(',');
  const rowLines = rows.map(row => columns.map(c => escapeCsv(row[c])).join(','));
  return [headerLine, ...rowLines].join('\n');
}
