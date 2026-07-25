/**
 * CSV & Google Sheets Import/Export Service Module
 */

export function parseCsvText(csvText) {
  if (!csvText || !csvText.trim()) return { columns: [], rows: [] };
  
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return { columns: [], rows: [] };

  const firstLine = lines[0];
  const delimiter = (firstLine.includes('\t') && !firstLine.includes(',')) ? '\t' : ',';

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
      } else if ((char === delimiter || (delimiter === ',' && char === '\t')) && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Find actual header line
  let headerIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 3); i++) {
    const parsed = parseLine(lines[i]).filter(Boolean);
    if (parsed.some(h => h.toLowerCase().includes('target') || h.toLowerCase().includes('result') || h.toLowerCase().includes('word'))) {
      headerIdx = i;
      break;
    }
  }

  const rawHeaders = parseLine(lines[headerIdx]);
  const headers = rawHeaders.filter(h => h && h.trim() !== '');
  const rows = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const values = parseLine(line);
    if (values[0] === 'id' && values[1] && (values[1].includes('target') || values[1].includes('word'))) continue;

    const rowObj = { _level: 'l1' };
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] !== undefined ? values[idx] : '';
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
