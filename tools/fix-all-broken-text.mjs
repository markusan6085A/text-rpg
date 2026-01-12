import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Маппінг битих послідовностей на правильний текст
const replacements = [
  ['Р­С„С„РµРєС‚', 'Эффект'],
  ['РєР°СЃС‚СѓРµС‚СЃСЏ', 'кастуется'],
  ['РґРµР№СЃС‚РІСѓРµС‚', 'действует'],
  ['РЅР°', 'на'],
  ['РІ', 'в'],
  ['РїСЂРµРґРµР»Р°С…', 'пределах'],
  ['РґР°Р»СЊРЅРѕСЃС‚Рё', 'дальности'],
  ['Р›РµС‡РµРЅРёРµ', 'Лечение'],
  ['СЃРёР»РѕР№', 'силой'],
  ['СЃРµР±СЏ', 'себя'],
  ['Рё', 'и'],
  ['РґСЂСѓРіРёС…', 'других'],
  ['РЎР°РјРѕ', 'Само'],
  ['РЎР°РјРѕР»РµС‡РµРЅРёРµ', 'Самоизлечение'],
  ['РЈРјРµРЅСЊС€Р°РµС‚', 'Уменьшает'],
  ['С„РёР·РёС‡РµСЃРєСѓСЋ', 'физическую'],
  ['Р°С‚Р°РєСѓ', 'атаку'],
  ['РІС‹С‚РµСЃРЅСЏРµС‚', 'вытесняет'],
  ['РёР»Рё', 'или'],
  ['РІС‹С‚РµСЃРЅСЏРµС‚СЃСЏ', 'вытесняется'],
  ['СЃР»РµРґСѓСЋС‰РёРјРё', 'следующими'],
  ['Р±Р°С„С„Р°РјРё', 'баффами'],
  ['РґРµР±Р°С„С„Р°РјРё', 'дебаффами'],
  ['РґРµР±Р°С„С„', 'дебафф'],
  ['СЃ', 'с'],
  ['Р±Р°Р·РѕРІС‹Рј', 'базовым'],
  ['С€Р°РЅСЃРѕРј', 'шансом'],
  ['РїСЂРѕС…РѕР¶РґРµРЅРёРµ', 'прохождение'],
  ['Р·Р°РІРёСЃРёС‚', 'зависит'],
  ['РѕС‚', 'от'],
  ['С†РµР»Рё', 'цели'],
  ['С‚РѕР»СЊРєРѕ', 'только'],
  ['РІСЂР°РіРѕРІ', 'врагов'],
  ['СЃРµРє', 'сек'],
  ['РјРёРЅ', 'мин'],
  ['Р”РµР±Р°С„С„', 'Дебафф'],
  ['РЎР°РјРѕР»РµС‡РµРЅРёРµ', 'Самоизлечение'],
  ['РЎР°РјРѕ', 'Само'],
  ['СЂР°РґРёСѓСЃ', 'радиус'],
  ['РІРѕРєСЂСѓРі', 'вокруг'],
  ['С†РµР»СЊ', 'цель'],
  // Додаткові заміни
  ['СЂР°РґРёСѓСЃРµ', 'радиусе'],
  ['РђС‚Р°РєР°', 'Атака'],
  ['Р°С‚Р°РєР°', 'атака'],
  ['РІРµС‚СЂРѕРј', 'ветром'],
  ['РњР°РіРёС‡РµСЃРєР°СЏ', 'Магическая'],
  ['РњР°РіиС‡РµсРєР°СЏ', 'Магическая'],
  ['РќР°РЅРѕСЃРёС‚', 'Наносит'],
  ['РќР°РЅРѕсиС‚', 'Наносит'],
  ['СЌС„С„РµРєС‚', 'эффект'],
  ['СЏРґР°', 'яда'],
  ['РћС‚РЅРёРјР°РµС‚', 'Отнимает'],
  ['РћС‚РЅиРјР°РµС‚', 'Отнимает'],
  ['Сѓ', 'у'],
  ['РїРѕ', 'по'],
  ['СЂР°Р·', 'раз'],
  ['РЈРІРµР»РёС‡РёРІР°РµС‚', 'Увеличивает'],
  ['РЈвРµР»иС‡ивР°РµС‚', 'Увеличивает'],
  ['Р·Р°С‰РёС‚Сѓ', 'защиту'],
  ['Р·Р°С‰иС‚Сѓ', 'защиту'],
  ['РјРёРЅ', 'мин'],
  ['РјиРЅ', 'мин'],
  ['С‚СЊРјРѕР№', 'тьмой'],
  ['РЅР°РЅРµСЃРµРЅРЅС‹С…', 'нанесенных'],
  ['РЅР°РЅРµсРµРЅРЅС‹С…', 'нанесенных'],
  ['РїРѕРІСЂРµР¶РґРµРЅРёР№', 'повреждений'],
  ['РїРѕРІСЂРµР¶РґРµРЅиР№', 'повреждений'],
  ['РїРµСЂРµРіРѕРЅСЏРµС‚СЃСЏ', 'перегоняется'],
  ['РїРµСЂРµРіРѕРЅСЏРµС‚сСЏ', 'перегоняется'],
  ['РІР°С€Рё', 'ваши'],
  ['РІР°С€и', 'ваши'],
  ['РёР·', 'Из'],
  ['РР·', 'Из'],
  // Варіанти з різними кодуваннями
  ['вРµС‚СЂРѕРј', 'ветром'],
  ['РњР°РіиС‡РµсРєР°СЏ', 'Магическая'],
  ['вСЂР°РіРѕв', 'врагов'],
  ['сРµРє', 'сек'],
  ['РґСЂуРіиС…', 'других'],
  ['С„иР·иС‡РµсРєуСЋ', 'физическую'],
  ['Р·Р°С‰иС‚у', 'защиту'],
  ['наРЅРµсРµРЅРЅС‹С…', 'нанесенных'],
  ['повСЂРµР¶РґРµРЅиР№', 'повреждений'],
  ['С†РµР»и', 'цели'],
  ['Р’С‹С‚РµсРЅСЏРµС‚', 'Вытесняет'],
  ['сР»РµРґуСЋС‰иРји', 'следующими'],
  ['Р±Р°С„С„Р°Рји', 'баффами'],
  ['дебаффР°Рји', 'дебаффами'],
  // Ще варіанти
  ['Р±Р°Р·РѕвС‹Рј', 'базовым'],
  ['С€Р°РЅсРѕРј', 'шансом'],
  ['РїСЂРѕС…РѕР¶РґРµРЅиРµ', 'прохождение'],
  ['Р·Р°висиС‚', 'зависит'],
  ['иР»и', 'или'],
  ['вС‹С‚РµсРЅСЏРµС‚сСЏ', 'вытесняется'],
  ['РђС‚Р°РєР°', 'Атака'],
  ['РњР°РіиС‡РµсРєР°СЏ', 'Магическая'],
  // Додаткові варіанти для ShillienOracle
  ['СЂР°РґиусРµ', 'радиусе'],
  ['СЂР°РґРёСѓСЃ', 'радиус'],
  ['РІРѕРєСЂСѓРі', 'вокруг'],
  // Ще заміни
  ['РЎРЅиРјР°РµС‚', 'Снимает'],
  ['всРµ', 'все'],
  ['эффектС‹', 'эффекты'],
  ['РјРѕС‰РЅРѕсС‚СЊСЋ', 'мощностью'],
  ['РјРµРЅСЊС€Рµ', 'меньше'],
];

function fixBrokenText(text) {
  if (!text) return text;
  
  let result = text;
  for (const [broken, fixed] of replacements) {
    // Екрануємо спеціальні символи для regex
    const escaped = broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'g'), fixed);
  }
  
  return result;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Знаходимо description
    const descriptionMatch = content.match(/description:\s*["']([^"']+)["']/);
    
    if (!descriptionMatch) {
      return { processed: false, reason: 'No description found' };
    }
    
    const oldDescription = descriptionMatch[1];
    const newDescription = fixBrokenText(oldDescription);
    
    if (oldDescription === newDescription) {
      return { processed: false, reason: 'No broken text found' };
    }
    
    // Замінюємо description
    const quote = descriptionMatch[0].includes("'") ? "'" : '"';
    const escapedNew = newDescription.replace(new RegExp(quote === '"' ? '"' : "'", 'g'), quote === '"' ? '\\"' : "\\'");
    const newContent = content.replace(
      new RegExp(`description:\\s*${quote}([^${quote}]+)${quote}`),
      `description: ${quote}${escapedNew}${quote}`
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
      
      console.log(`✓ Fixed: ${path.relative(skillsDir, file)}`);
    }
  });
  
  console.log(`\nDone! Processed: ${processed} files, Changed: ${changed} files\n`);
  
  if (changes.length > 0 && changes.length <= 10) {
    console.log('All changes:');
    changes.forEach(change => {
      console.log(`\n${change.file}:`);
      console.log(`  Old: ${change.old}...`);
      console.log(`  New: ${change.new}...`);
    });
  }
}

main();

