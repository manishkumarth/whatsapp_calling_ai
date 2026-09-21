const { parse } = require('csv-parse');
const { Transform } = require('stream');

const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const records = [];
    const parser = parse({ columns: true, skip_empty_lines: true, trim: true });
    
    parser.on('data', (record) => records.push(record));
    parser.on('end', () => resolve(records));
    parser.on('error', reject);
    
    const stream = new Transform({
      transform(chunk, encoding, callback) {
        callback(null, chunk);
      },
    });
    
    stream.pipe(parser);
    stream.write(buffer);
    stream.end();
  });
};

const toCSV = (data, columns) => {
  if (!data.length) return '';
  const header = columns.join(',');
  const rows = data.map((row) =>
    columns.map((col) => {
      const val = row[col] ?? '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')
  );
  return [header, ...rows].join('\n');
};

module.exports = { parseCSV, toCSV };
