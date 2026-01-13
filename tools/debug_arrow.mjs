// tools/debug_arrow.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const arrowFile = path.join(__dirname, 'htmlскіли', 'arrow.txt');
const content = fs.readFileSync(arrowFile, 'utf-8');
const lines = content.split('\n');

console.log('Перші 30 рядків:');
lines.slice(0, 30).forEach((l, i) => {
  const trimmed = l.trim();
  console.log(`${i+1}: "${trimmed}" (length: ${trimmed.length}, has x: ${trimmed.includes(' x ')}, has special: ${/[^\x20-\x7E]/.test(trimmed)})`);
});




