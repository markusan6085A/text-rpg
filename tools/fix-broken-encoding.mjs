import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Функція для декодування битого тексту (Windows-1251 → UTF-8)
// Коли Windows-1251 читається як UTF-8, виникає mojibake
function decodeWindows1251(text) {
  if (!text) return text;
  
  // Перевіряємо, чи є биті символи (mojibake)
  // Биті символи виглядають як "Р­", "Рє", "Рґ", "С„" тощо
  const hasBrokenEncoding = /Р[Р-Я]|С[Р-Я]|Т[Р-Я]/.test(text) || 
                             text.includes('Р­С„С„РµРєС‚') || 
                             text.includes('РєР°СЃС‚СѓРµС‚СЃСЏ') ||
                             text.includes('РґРµР№СЃС‚РІСѓРµС‚');
  
  if (!hasBrokenEncoding) {
    return text; // Текст вже правильний
  }
  
  try {
    // Конвертуємо: UTF-8 string → bytes → Windows-1251 bytes → UTF-8 string
    // Крок 1: Отримуємо bytes з UTF-8 string (як він зараз зберігається)
    const utf8Bytes = Buffer.from(text, 'utf8');
    
    // Крок 2: Читаємо ці bytes як Windows-1251
    const windows1251Text = utf8Bytes.toString('latin1');
    
    // Крок 3: Конвертуємо Windows-1251 → UTF-8 правильно
    // Для цього потрібно прочитати як Windows-1251, але Node.js не має вбудованої підтримки
    // Використовуємо простий маппінг для основних символів
    
    // Альтернативний підхід: використовуємо Buffer з правильним кодуванням
    // Але оскільки Node.js не має Windows-1251, використовуємо iconv-lite або ручний маппінг
    
    // Використовуємо правильне декодування через Buffer
    // Конвертуємо: UTF-8 string (mojibake) → bytes → Windows-1251 → UTF-8
    try {
      // Крок 1: Отримуємо bytes з UTF-8 string (як він зараз зберігається)
      const utf8Bytes = Buffer.from(text, 'utf8');
      
      // Крок 2: Читаємо ці bytes як latin1 (що дає нам Windows-1251 bytes як string)
      const latin1String = utf8Bytes.toString('latin1');
      
      // Крок 3: Конвертуємо latin1 string назад в bytes
      const latin1Bytes = Buffer.from(latin1String, 'latin1');
      
      // Крок 4: Читаємо ці bytes як UTF-8 (правильне декодування)
      const decoded = latin1Bytes.toString('utf8');
      
      // Перевіряємо, чи результат виглядає правильно (не містить биті символи)
      if (!/Р[А-ЯЁ]|С[А-ЯЁ]|Т[А-ЯЁ]/.test(decoded)) {
        return decoded;
      }
    } catch (e) {
      // Якщо не вдалося, використовуємо простий маппінг
    }
    
    // Простий підхід: замінюємо найпоширеніші биті послідовності
    const replacements = {
      'Р­С„С„РµРєС‚': 'Эффект',
      'РєР°СЃС‚СѓРµС‚СЃСЏ': 'кастуется',
      'РґРµР№СЃС‚РІСѓРµС‚': 'действует',
      'РЅР°': 'на',
      'РІ': 'в',
      'РїСЂРµРґРµР»Р°С…': 'пределах',
      'РґР°Р»СЊРЅРѕСЃС‚Рё': 'дальности',
      'Р›РµС‡РµРЅРёРµ': 'Лечение',
      'СЃРёР»РѕР№': 'силой',
      'СЃРµР±СЏ': 'себя',
      'Рё': 'и',
      'РґСЂСѓРіРёС…': 'других',
      'РЎР°РјРѕ': 'Само',
      'РЎР°РјРѕР»РµС‡РµРЅРёРµ': 'Самоизлечение',
      'РЈРјРµРЅСЊС€Р°РµС‚': 'Уменьшает',
      'С„РёР·РёС‡РµСЃРєСѓСЋ': 'физическую',
      'Р°С‚Р°РєСѓ': 'атаку',
      'РІС‹С‚РµСЃРЅСЏРµС‚': 'вытесняет',
      'РёР»Рё': 'или',
      'РІС‹С‚РµСЃРЅСЏРµС‚СЃСЏ': 'вытесняется',
      'СЃР»РµРґСѓСЋС‰РёРјРё': 'следующими',
      'Р±Р°С„С„Р°РјРё': 'баффами',
      'РґРµР±Р°С„С„Р°РјРё': 'дебаффами',
      'РґРµР±Р°С„С„': 'дебафф',
      'СЃ': 'с',
      'Р±Р°Р·РѕРІС‹Рј': 'базовым',
      'С€Р°РЅСЃРѕРј': 'шансом',
      'РїСЂРѕС…РѕР¶РґРµРЅРёРµ': 'прохождение',
      'Р·Р°РІРёСЃРёС‚': 'зависит',
      'РѕС‚': 'от',
      'С†РµР»Рё': 'цели',
      'С‚РѕР»СЊРєРѕ': 'только',
      'РІСЂР°РіРѕРІ': 'врагов',
      'СЃРµРє': 'сек',
      'РјРёРЅ': 'мин',
    };
    
    let result = text;
    for (const [broken, fixed] of Object.entries(replacements)) {
      result = result.replace(new RegExp(broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fixed);
    }
    
    return result;
  } catch (error) {
    console.error('Error decoding text:', error);
    return text; // Повертаємо оригінал при помилці
  }
}

// Функція для обробки одного файлу
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Знаходимо description в файлі (підтримуємо обидва типи лапок)
    const descriptionMatch = content.match(/description:\s*["']([^"']+)["']/);
    
    if (!descriptionMatch) {
      return { processed: false, reason: 'No description found' };
    }
    
    const oldDescription = descriptionMatch[1];
    
    // Перевіряємо, чи є битий текст
    const hasBroken = oldDescription.includes('Р­С„С„РµРєС‚') || 
                      oldDescription.includes('РєР°СЃС‚СѓРµС‚СЃСЏ') ||
                      oldDescription.includes('РґРµР№СЃС‚РІСѓРµС‚') ||
                      oldDescription.includes('Р›РµС‡РµРЅРёРµ');
    
    if (!hasBroken) {
      return { processed: false, reason: 'No broken text found' };
    }
    
    const newDescription = decodeWindows1251(oldDescription);
    
    if (oldDescription === newDescription) {
      return { processed: false, reason: 'Decoding failed' };
    }
    
    // Замінюємо description (зберігаємо оригінальні лапки)
    const quote = descriptionMatch[0].includes("'") ? "'" : '"';
    const newContent = content.replace(
      new RegExp(`description:\\s*${quote}([^${quote}]+)${quote}`),
      `description: ${quote}${newDescription.replace(new RegExp(quote, 'g'), quote === '"' ? '\\"' : "\\'")}${quote}`
    );
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    
    return { 
      processed: true, 
      old: oldDescription.substring(0, 80), 
      new: newDescription.substring(0, 80)
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
  const skillsDir = path.join(__dirname, '..', 'src', 'data', 'skills', 'classes', 'DarkMystic');
  
  if (!fs.existsSync(skillsDir)) {
    console.error('Skills directory not found:', skillsDir);
    process.exit(1);
  }
  
  console.log('Searching for skill files in DarkMystic...');
  const skillFiles = findSkillFiles(skillsDir);
  console.log(`Found ${skillFiles.length} skill files\n`);
  
  let processed = 0;
  let changed = 0;
  const changes = [];
  
  skillFiles.forEach(file => {
    const result = processFile(file);
    processed++;
    
    if (result.processed) {
      changed++;
      changes.push({
        file: path.relative(skillsDir, file),
        old: result.old,
        new: result.new
      });
      
      if (changed % 5 === 0) {
        process.stdout.write(`\rProcessed: ${processed}/${skillFiles.length}, Changed: ${changed}`);
      }
    }
  });
  
  console.log(`\n\nDone! Processed: ${processed} files, Changed: ${changed} files\n`);
  
  if (changes.length > 0) {
    console.log('Sample changes:');
    changes.slice(0, 5).forEach(change => {
      console.log(`\n${change.file}:`);
      console.log(`  Old: ${change.old}...`);
      console.log(`  New: ${change.new}...`);
    });
  }
}

main();

