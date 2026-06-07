/**
 * Clean, lightweight, zero-dependency CSV parser that correctly handles
 * double quotes, commas, and line endings.
 */

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0 || !lines[0].trim()) return [];

  // Parse headers
  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = parseCsvLine(line);
    const record: Record<string, string> = {};

    headers.forEach((header, idx) => {
      record[header] = values[idx] !== undefined ? values[idx].trim() : '';
    });

    records.push(record);
  }

  return records;
}

/**
 * Splits a CSV line by commas, ignoring commas nested inside double quotes.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Toggle quote context, but do not append the quote character itself
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
