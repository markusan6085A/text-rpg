// tools/fix_weapon_categories_v2.mjs
// Скрипт для виправлення категорій зброї на основі weaponType з shop файлів

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Правильний маппінг weaponType -> category
const WEAPON_TYPE_TO_CATEGORY = {
  'SWORD': 'sword',
  'BIGSWORD': 'bigsword',
  'BLUNT': 'blunt',
  'BIGBLUNT': 'bigblunt',
  'POLE': 'pole',
  'BOW': 'bow',
  'DAGGER': 'dagger',
  'DUALFIST': 'dualfist',
  'FIST': 'fist',
  'ETC': 'staff', // ETC зазвичай для spellbook/staff
  'STAFF': 'staff',
  'RAPIER': 'rapier',
  'DUALSWORD': 'dualsword',
};

const shopFiles = [
  'src/data/shop/dGradeShop.ts',
  'src/data/shop/cGradeShop.ts',
  'src/data/shop/bGradeShop.ts',
  'src/data/shop/aGradeShop.ts',
  'src/data/shop/sGradeShop.ts',
  'src/data/shop/questShop.ts',
];

let totalFixed = 0;

for (const shopFile of shopFiles) {
  const filePath = path.join(projectRoot, shopFile);
  if (!fs.existsSync(filePath)) continue;
  
  console.log(`Перевіряємо ${shopFile}...`);
  let content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let changed = false;
  let fileFixed = 0;
  
  // Проходимо по рядках і шукаємо weaponType та category
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Шукаємо weaponType
    const weaponTypeMatch = line.match(/weaponType:\s*["']([^"']+)["']/);
    if (!weaponTypeMatch) continue;
    
    const weaponType = weaponTypeMatch[1];
    const correctCategory = WEAPON_TYPE_TO_CATEGORY[weaponType];
    
    if (!correctCategory) continue;
    
    // Шукаємо category в наступних рядках (в межах 20 рядків назад або вперед)
    let categoryFound = false;
    
    // Шукаємо назад (category має бути перед weaponType)
    for (let j = Math.max(0, i - 20); j < i; j++) {
      const catLine = lines[j];
      const categoryMatch = catLine.match(/category:\s*["']([^"']+)["']/);
      if (categoryMatch) {
        const currentCategory = categoryMatch[1];
        
        // Виняток: ETC може бути spellbook замість staff
        if (weaponType === 'ETC' && (currentCategory === 'spellbook' || currentCategory === 'staff')) {
          categoryFound = true;
          break;
        }
        
        if (currentCategory !== correctCategory) {
          console.log(`  Виправляємо: ${currentCategory} -> ${correctCategory} (weaponType: ${weaponType})`);
          lines[j] = catLine.replace(/category:\s*["'][^"']+["']/, `category: "${correctCategory}"`);
          changed = true;
          fileFixed++;
        }
        categoryFound = true;
        break;
      }
    }
    
    // Якщо не знайшли назад, шукаємо вперед
    if (!categoryFound) {
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        const catLine = lines[j];
        
        // Якщо знайшли наступний weaponType, зупиняємось
        if (catLine.match(/weaponType:\s*["']/)) break;
        
        const categoryMatch = catLine.match(/category:\s*["']([^"']+)["']/);
        if (categoryMatch) {
          const currentCategory = categoryMatch[1];
          
          // Виняток: ETC може бути spellbook замість staff
          if (weaponType === 'ETC' && (currentCategory === 'spellbook' || currentCategory === 'staff')) {
            break;
          }
          
          if (currentCategory !== correctCategory) {
            console.log(`  Виправляємо: ${currentCategory} -> ${correctCategory} (weaponType: ${weaponType})`);
            lines[j] = catLine.replace(/category:\s*["'][^"']+["']/, `category: "${correctCategory}"`);
            changed = true;
            fileFixed++;
          }
          break;
        }
      }
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log(`  Виправлено ${fileFixed} категорій в ${shopFile}\n`);
    totalFixed += fileFixed;
  } else {
    console.log(`  Нічого не потрібно виправляти\n`);
  }
}

console.log(`Всього виправлено ${totalFixed} категорій зброї`);
