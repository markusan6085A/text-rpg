import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const skillsDir = path.join(__dirname, '..', 'src', 'data', 'skills', 'classes', 'DarkMystic', 'ShillienElder');
const files = fs.readdirSync(skillsDir).filter(f => f.startsWith('skill_') && f.endsWith('.ts'));

console.log(`Знайдено ${files.length} файлів скілів\n`);

// Генеруємо імпорти та експорти
const imports = [];
const exports = [];
const skillMap = [];

files.forEach(file => {
  const skillVar = file.replace('.ts', '');
  imports.push(`import { ${skillVar} } from "./${skillVar}";`);
  exports.push(`  ${skillVar},`);
  skillMap.push(`  ${skillVar},`);
});

const indexContent = `import type { SkillDefinition } from "../../../types";
${imports.join('\n')}

// Shillien Elder (Dark Elf 2nd profession) skills for levels 40+.
export {
${exports.join('\n')}
};

export const DarkMysticShillienElderSkills: Record<string, SkillDefinition> = {
${skillMap.join('\n')}
};
`;

const indexPath = path.join(skillsDir, 'index.ts');
fs.writeFileSync(indexPath, indexContent, 'utf-8');

console.log(`✅ Оновлено index.ts з ${files.length} скілами!`);


