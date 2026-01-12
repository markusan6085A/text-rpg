import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, '..', 'tools', 'htmlскіли', 'спелшоувер.txt');

try {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const skills = new Set();
  
  lines.forEach(line => {
    // Шукаємо назви скілів (починаються з великої літери, перед табуляцією)
    const match = line.match(/^([A-Z][a-zA-Z ]+?)\t/);
    if (match) {
      const skillName = match[1].trim();
      // Виключаємо "Level" та "Spellhowler"
      if (!skillName.includes('Level') && !skillName.includes('Spellhowler') && skillName.length > 2) {
        skills.add(skillName);
      }
    }
  });
  
  console.log('Унікальні скіли для Spellhowler:');
  console.log('================================');
  Array.from(skills).sort().forEach(skill => {
    console.log(`- ${skill}`);
  });
  console.log(`\nВсього: ${skills.size} скілів`);
  
} catch (e) {
  console.error('Помилка:', e.message);
}

