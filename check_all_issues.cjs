const fs = require('fs');
const path = require('path');

const issues = {
  skillsWithoutPower: [],
  skillsWithZeroPower: [],
  russianTranslations: [],
  missingIcons: [],
  errors: []
};

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (file.endsWith('.ts') && (file.startsWith('skill_') || file.startsWith('Skill_'))) {
      callback(fullPath);
    }
  });
}

const skillsDir = path.join(__dirname, 'src/data/skills/classes');
const iconsDir = path.join(__dirname, 'public/skills');

// Get all icon files
const iconFiles = new Set();
if (fs.existsSync(iconsDir)) {
  const icons = fs.readdirSync(iconsDir, { recursive: true });
  icons.forEach(icon => {
    if (typeof icon === 'string') {
      iconFiles.add(icon.replace(/\\/g, '/'));
    }
  });
}

walkDir(skillsDir, (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract skill ID
    const idMatch = content.match(/id:\s*(\d+)/);
    const skillId = idMatch ? idMatch[1] : 'unknown';
    
    // Check for Russian text
    if (/[А-Яа-яЁё]/.test(content)) {
      const russianLines = content.split('\n').filter(line => /[А-Яа-яЁё]/.test(line));
      issues.russianTranslations.push({
        file: path.relative(__dirname, filePath),
        id: skillId,
        lines: russianLines.slice(0, 3)
      });
    }
    
    // Check for power values
    const categoryMatch = content.match(/category:\s*["']([^"']+)["']/);
    const category = categoryMatch ? categoryMatch[1] : '';
    
    // Check if it's an attack or heal skill
    const isAttackOrHeal = category === 'magic_attack' || category === 'physical_attack' || category === 'heal';
    
    // Find all level definitions
    const levelMatches = content.matchAll(/level:\s*(\d+)[^}]*?power:\s*([^\s,}]+)/g);
    const levels = Array.from(levelMatches);
    
    if (levels.length === 0) {
      // Try to find if there are levels but no power
      if (content.includes('levels:') && content.includes('level:')) {
        issues.skillsWithoutPower.push({
          file: path.relative(__dirname, filePath),
          id: skillId,
          category,
          isAttackOrHeal
        });
      }
    } else {
      levels.forEach(match => {
        const powerValue = match[2].trim();
        if (powerValue === '0' || powerValue === '0.0') {
          issues.skillsWithZeroPower.push({
            file: path.relative(__dirname, filePath),
            id: skillId,
            level: match[1],
            category,
            isAttackOrHeal
          });
        }
      });
    }
    
    // Check for icon
    const iconMatch = content.match(/icon:\s*["']([^"']+)["']/);
    if (iconMatch) {
      const iconPath = iconMatch[1];
      const iconFileName = iconPath.replace(/^\/skills\//, '').replace(/^skills\//, '');
      if (!iconFiles.has(iconFileName)) {
        issues.missingIcons.push({
          file: path.relative(__dirname, filePath),
          id: skillId,
          icon: iconPath
        });
      }
    }
    
  } catch (e) {
    issues.errors.push({
      file: path.relative(__dirname, filePath),
      error: e.message
    });
  }
});

console.log('=== ЗВІТ ПРО ПРОБЛЕМИ В ПРОЄКТІ ===\n');

console.log(`📊 Загальна статистика:`);
console.log(`   Скілів з російським перекладом: ${issues.russianTranslations.length}`);
console.log(`   Скілів без power: ${issues.skillsWithoutPower.length}`);
console.log(`   Скілів з power: 0: ${issues.skillsWithZeroPower.length}`);
console.log(`   Скілів з відсутніми іконками: ${issues.missingIcons.length}`);
console.log(`   Помилок при обробці: ${issues.errors.length}\n`);

// Attack/Heal skills with zero power
const attackHealZeroPower = issues.skillsWithZeroPower.filter(s => s.isAttackOrHeal);
if (attackHealZeroPower.length > 0) {
  console.log(`\n❌ КРИТИЧНО: Атакуючі/лікуючі скіли з power: 0 (${attackHealZeroPower.length}):`);
  attackHealZeroPower.slice(0, 20).forEach(s => {
    console.log(`   Skill ${s.id} (level ${s.level}) - ${s.file}`);
  });
  if (attackHealZeroPower.length > 20) {
    console.log(`   ... і ще ${attackHealZeroPower.length - 20}`);
  }
}

// Skills without power
if (issues.skillsWithoutPower.length > 0) {
  console.log(`\n⚠️  Скіли без значення power (${issues.skillsWithoutPower.length}):`);
  issues.skillsWithoutPower.slice(0, 10).forEach(s => {
    console.log(`   Skill ${s.id} (${s.category}) - ${s.file}`);
  });
  if (issues.skillsWithoutPower.length > 10) {
    console.log(`   ... і ще ${issues.skillsWithoutPower.length - 10}`);
  }
}

// Russian translations
if (issues.russianTranslations.length > 0) {
  console.log(`\n🌐 Скіли з російським перекладом (${issues.russianTranslations.length}):`);
  issues.russianTranslations.slice(0, 10).forEach(s => {
    console.log(`   Skill ${s.id} - ${s.file}`);
    if (s.lines.length > 0) {
      console.log(`      Приклад: ${s.lines[0].trim().substring(0, 60)}...`);
    }
  });
  if (issues.russianTranslations.length > 10) {
    console.log(`   ... і ще ${issues.russianTranslations.length - 10}`);
  }
}

// Missing icons
if (issues.missingIcons.length > 0) {
  console.log(`\n🖼️  Скіли з відсутніми іконками (${issues.missingIcons.length}):`);
  issues.missingIcons.slice(0, 10).forEach(s => {
    console.log(`   Skill ${s.id} - ${s.icon} (${s.file})`);
  });
  if (issues.missingIcons.length > 10) {
    console.log(`   ... і ще ${issues.missingIcons.length - 10}`);
  }
}

// Errors
if (issues.errors.length > 0) {
  console.log(`\n❌ Помилки при обробці (${issues.errors.length}):`);
  issues.errors.forEach(e => {
    console.log(`   ${e.file}: ${e.error}`);
  });
}

console.log('\n=== КІНЕЦЬ ЗВІТУ ===');

