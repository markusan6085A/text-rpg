// tools/find_duplicates.mjs
// Знайти дублікати ключів в chunk файлах

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chunksDir = path.join(__dirname, '..', 'src', 'data', 'items');

for (let i = 0; i < 10; i++) {
  const filePath = path.join(chunksDir, `itemsDB_chunk_${i}.ts`);
  if (!fs.existsSync(filePath)) continue;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const keys = new Map();
  const duplicates = [];
  
  lines.forEach((line, index) => {
    const match = line.match(/^  ([a-z_]+): \{/);
    if (match) {
      const key = match[1];
      if (keys.has(key)) {
        duplicates.push({ key, line1: keys.get(key), line2: index + 1 });
      } else {
        keys.set(key, index + 1);
      }
    }
  });
  
  if (duplicates.length > 0) {
    console.log(`\nДублікати в chunk_${i}.ts:`);
    duplicates.forEach(dup => {
      console.log(`  ${dup.key}: рядки ${dup.line1} та ${dup.line2}`);
    });
  }
}

