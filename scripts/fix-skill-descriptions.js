import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Функція для декодування битого тексту (mojibake)
// Биті тексти часто виникають коли Windows-1251 читається як UTF-8
function decodeMojibake(text) {
  try {
    // Спробуємо декодувати як Windows-1251 -> UTF-8
    const buffer = Buffer.from(text, 'latin1');
    const decoded = buffer.toString('utf8');
    
    // Перевіряємо, чи це виглядає як правильний текст
    if (decoded.includes('Р') || decoded.includes('С') || decoded.includes('Т')) {
      // Це все ще битий текст, спробуємо інший підхід
      return null;
    }
    
    return decoded;
  } catch (e) {
    return null;
  }
}

// Функція для виправлення битого тексту
function fixBrokenText(text) {
  if (!text) return text;
  
  // Якщо текст містить биті символи (mojibake), замінюємо на загальний опис
  const brokenPatterns = [
    /Р[Р-Я]/g, // Биті кириличні символи
    /Р[Р-Я]/g,
    /С[Р-Я]/g,
    /Т[Р-Я]/g,
  ];
  
  let hasBroken = false;
  for (const pattern of brokenPatterns) {
    if (pattern.test(text)) {
      hasBroken = true;
      break;
    }
  }
  
  // Якщо текст містить англійський текст, залишаємо як є
  if (text.match(/[A-Za-z]/) && !hasBroken) {
    return text;
  }
  
  // Якщо текст битий, замінюємо на загальний опис
  if (hasBroken || text.includes('РћРїРёСЃР°РЅРёРµ') || text.includes('СѓРјРµРЅРёСЏ')) {
    return 'Описание умения.';
  }
  
  return text;
}

// Функція для обробки одного файлу
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Знаходимо description в файлі
    const descriptionMatch = content.match(/description:\s*["']([^"']+)["']/);
    
    if (!descriptionMatch) {
      return { processed: false, reason: 'No description found' };
    }
    
    const oldDescription = descriptionMatch[1];
    const newDescription = fixBrokenText(oldDescription);
    
    if (oldDescription === newDescription) {
      return { processed: false, reason: 'No changes needed' };
    }
    
    // Замінюємо description
    const newContent = content.replace(
      /description:\s*["']([^"']+)["']/,
      `description: "${newDescription}"`
    );
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    
    return { 
      processed: true, 
      old: oldDescription.substring(0, 50), 
      new: newDescription 
    };
  } catch (error) {
    return { processed: false, reason: error.message };
  }
}

// Функція для рекурсивного пошуку всіх файлів
function findSkillFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findSkillFiles(filePath, fileList);
    } else if (file.match(/skill.*\.ts$/i) || file.match(/Skill.*\.ts$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Головна функція
function main() {
  const skillsDir = path.join(__dirname, '..', 'src', 'data', 'skills');
  
  if (!fs.existsSync(skillsDir)) {
    console.error('Skills directory not found:', skillsDir);
    process.exit(1);
  }
  
  console.log('Searching for skill files...');
  const skillFiles = findSkillFiles(skillsDir);
  console.log(`Found ${skillFiles.length} skill files`);
  
  let processed = 0;
  let changed = 0;
  
  skillFiles.forEach(file => {
    const result = processFile(file);
    processed++;
    
    if (result.processed) {
      changed++;
      if (changed % 10 === 0) {
        process.stdout.write(`\rProcessed: ${processed}/${skillFiles.length}, Changed: ${changed}`);
      }
    }
  });
  
  console.log(`\n\nDone! Processed: ${processed} files, Changed: ${changed} files`);
}

main();

