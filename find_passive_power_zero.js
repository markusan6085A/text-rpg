const fs = require('fs');
const path = require('path');

function findPassiveSkillsWithPowerZero(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findPassiveSkillsWithPowerZero(fullPath, results);
    } else if (file.endsWith('.ts') && !file.includes('index.ts')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Перевіряємо, чи це пасивний скіл
        if (content.includes('category: "passive"') || content.includes("category: 'passive'")) {
          const idMatch = content.match(/id:\s*(\d+)/);
          const id = idMatch ? idMatch[1] : 'unknown';
          
          // Знаходимо всі рівні з power: 0
          const levelMatches = content.matchAll(/level:\s*(\d+)[^}]*?power:\s*0/g);
          const powerZeroLevels = [];
          
          for (const match of levelMatches) {
            // Спробуємо знайти номер рівня
            const levelMatch = content.substring(0, match.index).match(/level:\s*(\d+)[^}]*?$/);
            if (levelMatch) {
              powerZeroLevels.push(parseInt(levelMatch[1]));
            } else {
              powerZeroLevels.push('?');
            }
          }
          
          if (powerZeroLevels.length > 0) {
            results.push({
              file: fullPath.replace(/\\/g, '/'),
              id,
              powerZeroLevels,
              count: powerZeroLevels.length
            });
          }
        }
      } catch (e) {
        // Ігноруємо помилки
      }
    }
  }
  
  return results;
}

const results = findPassiveSkillsWithPowerZero('./src/data/skills/classes');
console.log(JSON.stringify(results, null, 2));
console.log(`\nTotal files with power: 0 in passive skills: ${results.length}`);

