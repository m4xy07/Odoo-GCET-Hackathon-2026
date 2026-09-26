// Spreadsheet apps run a text cell that starts with = + - @ as a formula, so such text gets a leading quote.
// Numbers are left alone, so -3 stays a number.
function cell(value: string | number) {
  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: (string | number)[][]) {
  return rows.map((row) => row.map(cell).join(',')).join('\r\n');
}

// Built in the browser from what is on screen, no extra request
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  // the byte order mark makes Excel read the file as UTF-8
  const blob = new Blob(['\ufeff' + toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
