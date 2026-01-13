import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const skillsDir = path.join(__dirname, '..', 'src', 'data', 'skills');

function findSkillFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findSkillFiles(fullPath));
    } else if (entry.name.match(/skill.*\.ts$/i) || entry.name.match(/Skill.*\.ts$/)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

const brokenText = 'РћРїРёСЃР°РЅРёРµ СѓРјРµРЅРёСЏ';
const fixedText = 'Описание умения';

const files = findSkillFiles(skillsDir);
let changed = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes(brokenText)) {
    const newContent = content.replace(new RegExp(brokenText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fixedText);
    fs.writeFileSync(file, newContent, 'utf8');
    changed++;
    console.log(`Fixed: ${path.relative(path.join(__dirname, '..'), file)}`);
  }
}

console.log(`\nDone! Fixed ${changed} files out of ${files.length} total.`);

