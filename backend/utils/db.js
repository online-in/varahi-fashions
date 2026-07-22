const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readData(name) {
  const file = filePath(name);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf-8');
  try {
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error(`Failed to parse ${name}.json`, e);
    return [];
  }
}

function writeData(name, data) {
  const file = filePath(name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function nextId(list) {
  if (!list.length) return 1;
  return Math.max(...list.map((item) => item.id)) + 1;
}

module.exports = { readData, writeData, nextId };
