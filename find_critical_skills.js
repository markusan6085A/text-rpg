const fs = require('fs');
const path = require('path');

function findCriticalSkills(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findCriticalSkills(fullPath, results);
    } else if (file.endsWith('.ts') && !file.includes('index.ts')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Перевіряємо, чи це атакуючий/лікуючий скіл
        const categoryMatch = content.match(/category:\s*['"](heal|physical_attack|magic_attack)['"]/);
        if (categoryMatch) {
          const idMatch = content.match(/id:\s*(\d+)/);
          const nameMatch = content.match(/name:\s*['"]([^'"]+)['"]/);
          const category = categoryMatch[1];
          
          // Перевіряємо, чи є power: 0 в рівнях
          const levelsMatch = content.match(/levels:\s*\[([\s\S]*?)\]/);
          if (levelsMatch) {
            const levelsContent = levelsMatch[1];
            // Перевіряємо, чи є хоч один рівень з power: 0
            const hasPowerZero = /power:\s*0[,\s}]/.test(levelsContent);
            
            if (hasPowerZero && idMatch) {
              // Перевіряємо всі рівні
              const levelMatches = levelsContent.matchAll(/level:\s*(\d+)[\s\S]*?power:\s*(\d+(?:\.\d+)?)/g);
              const powerZeroLevels = [];
              
              for (const match of levelMatches) {
                if (parseFloat(match[2]) === 0) {
                  powerZeroLevels.push(parseInt(match[1]));
                }
              }
              
              results.push({
                file: fullPath.replace(/\\/g, '/'),
                id: idMatch[1],
                name: nameMatch ? nameMatch[1] : 'unknown',
                category,
                powerZeroLevels
              });
            }
          }
        }
      } catch (e) {
        // Ігноруємо помилки
      }
    }
  }
  
  return results;
}

const results = findCriticalSkills('./src/data/skills/classes');
console.log(`Знайдено ${results.length} критичних скілів:\n`);
results.forEach((r, i) => {
  console.log(`${i + 1}. Skill ${r.id} (${r.name})`);
  console.log(`   Категорія: ${r.category}`);
  console.log(`   Файл: ${r.file}`);
  console.log(`   Рівні з power: 0: ${r.powerZeroLevels.join(', ') || 'всі'}`);
  console.log('');
});

