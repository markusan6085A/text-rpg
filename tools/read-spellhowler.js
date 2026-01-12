import { readFileSync } from 'fs';
import { join } from 'path';

const filePath = join('tools', 'htmlскіли', 'Spellhowler.txt');

try {
  // Спробуємо різні кодування
  const encodings = ['utf8', 'utf16le', 'latin1', 'cp1251'];
  
  for (const enc of encodings) {
    try {
      const content = readFileSync(filePath, enc);
      if (content && content.trim().length > 0) {
        console.log(`\n=== Content (${enc}): ===\n`);
        console.log(content.substring(0, 5000));
        break;
      }
    } catch (e) {
      // Продовжуємо
    }
  }
  
  // Якщо нічого не знайшли, спробуємо raw
  const raw = readFileSync(filePath);
  console.log(`\n=== Raw bytes (first 200): ===`);
  console.log(raw.slice(0, 200));
  console.log(`\nFile size: ${raw.length} bytes`);
  
} catch (e) {
  console.error('Error:', e.message);
}

