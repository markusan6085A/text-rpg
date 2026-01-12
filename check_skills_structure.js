const fs = require('fs');
const path = require('path');

const skillsDir = path.join(__dirname, 'src/data/skills/classes');
const iconsDir = path.join(__dirname, 'public/skills');

// Отримуємо всі файли скілів
function getAllSkillFiles(dir) {
  const files = [];
  
  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.ts') && (entry.name.startsWith('Skill_') || entry.name.startsWith('skill_'))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Отримуємо всі іконки
function getAllIcons(dir) {
  if (!fs.existsSync(dir)) {
    return new Set();
  }
  const files = fs.readdirSync(dir);
  return new Set(files);
}

// Парсимо іконку з файлу скілу
function extractIconFromSkillFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const iconMatch = content.match(/icon:\s*["']([^"']+)["']/);
    if (iconMatch) {
      return iconMatch[1];
    }
  } catch (e) {
    console.error(`Помилка читання ${filePath}:`, e.message);
  }
  return null;
}

// Парсимо ID скілу з назви файлу
function extractSkillIdFromFileName(fileName) {
  const match = fileName.match(/(?:Skill_|skill_)(\d+)\.ts/);
  return match ? parseInt(match[1]) : null;
}

// Основна перевірка
console.log('🔍 Перевірка структури скілів...\n');

const skillFiles = getAllSkillFiles(skillsDir);
const icons = getAllIcons(iconsDir);

console.log(`📁 Знайдено файлів скілів: ${skillFiles.length}`);
console.log(`🖼️  Знайдено іконок: ${icons.size}\n`);

const issues = {
  missingIcons: [],
  invalidIcons: [],
  skillsWithoutIcons: [],
  duplicateIds: new Map(),
};

const skillIds = new Map();

// Перевіряємо кожен файл скілу
for (const filePath of skillFiles) {
  const fileName = path.basename(filePath);
  const skillId = extractSkillIdFromFileName(fileName);
  const iconPath = extractIconFromSkillFile(filePath);
  
  if (skillId) {
    if (skillIds.has(skillId)) {
      const existing = skillIds.get(skillId);
      if (!issues.duplicateIds.has(skillId)) {
        issues.duplicateIds.set(skillId, [existing]);
      }
      issues.duplicateIds.get(skillId).push(filePath);
    } else {
      skillIds.set(skillId, filePath);
    }
  }
  
  if (!iconPath) {
    issues.skillsWithoutIcons.push(filePath);
    continue;
  }
  
  // Витягуємо назву файлу іконки з шляху
  const iconFileName = iconPath.replace(/^\/skills\//, '');
  
  if (!icons.has(iconFileName)) {
    issues.missingIcons.push({
      skillFile: filePath,
      skillId: skillId,
      iconPath: iconPath,
      iconFileName: iconFileName
    });
  }
}

// Виводимо результати
console.log('📊 Результати перевірки:\n');

if (issues.missingIcons.length > 0) {
  console.log(`❌ Відсутні іконки (${issues.missingIcons.length}):`);
  issues.missingIcons.slice(0, 20).forEach(({ skillFile, skillId, iconPath }) => {
    const relPath = path.relative(__dirname, skillFile);
    console.log(`   Skill ${skillId}: ${iconPath} (${relPath})`);
  });
  if (issues.missingIcons.length > 20) {
    console.log(`   ... і ще ${issues.missingIcons.length - 20} файлів`);
  }
  console.log('');
}

if (issues.skillsWithoutIcons.length > 0) {
  console.log(`⚠️  Скіли без іконок (${issues.skillsWithoutIcons.length}):`);
  issues.skillsWithoutIcons.slice(0, 10).forEach(filePath => {
    const relPath = path.relative(__dirname, filePath);
    console.log(`   ${relPath}`);
  });
  if (issues.skillsWithoutIcons.length > 10) {
    console.log(`   ... і ще ${issues.skillsWithoutIcons.length - 10} файлів`);
  }
  console.log('');
}

if (issues.duplicateIds.size > 0) {
  console.log(`⚠️  Дублікати ID скілів (${issues.duplicateIds.size}):`);
  issues.duplicateIds.forEach((files, skillId) => {
    console.log(`   Skill ${skillId}:`);
    files.forEach(filePath => {
      const relPath = path.relative(__dirname, filePath);
      console.log(`     - ${relPath}`);
    });
  });
  console.log('');
}

// Статистика
console.log('📈 Статистика:');
console.log(`   Унікальних ID скілів: ${skillIds.size}`);
console.log(`   Файлів з іконками: ${skillFiles.length - issues.skillsWithoutIcons.length}`);
console.log(`   Файлів без іконок: ${issues.skillsWithoutIcons.length}`);
console.log(`   Відсутніх іконок: ${issues.missingIcons.length}`);
console.log(`   Дублікатів ID: ${issues.duplicateIds.size}`);

if (issues.missingIcons.length === 0 && issues.skillsWithoutIcons.length === 0 && issues.duplicateIds.size === 0) {
  console.log('\n✅ Всі перевірки пройдені успішно!');
} else {
  console.log('\n⚠️  Знайдено проблеми, які потребують уваги.');
  process.exit(1);
}

