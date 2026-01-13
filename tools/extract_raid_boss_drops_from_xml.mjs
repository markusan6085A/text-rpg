import fs from 'fs';
import path from 'path';

// Читаємо items_with_icons.json для маппінгу ID -> itemId
const itemsData = JSON.parse(fs.readFileSync('./tools/items_with_icons.json', 'utf8'));
const idToItemId = {};
itemsData.forEach(item => {
  const key = item.name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  if (/^\d/.test(key)) {
    idToItemId[item.id] = 'item_' + key;
  } else if (key.length < 3) {
    idToItemId[item.id] = 'item_' + item.id;
  } else {
    idToItemId[item.id] = key;
  }
});

// Наші рівні рейд-босів
const ourRaidBossLevels = [12, 16, 18, 20, 22, 24, 26, 27, 28, 30, 35, 36, 37, 38, 40, 42, 44, 45, 46, 48, 50, 51, 52];

// Читаємо XML файли з рейд-босами
const mobsDir = './tools/htmlскіли/моби!';
const xmlFiles = fs.readdirSync(mobsDir).filter(f => f.endsWith('.xml'));

console.log('Пошук рейд-босів у XML файлах...\n');

const raidBosses = [];

xmlFiles.forEach(xmlFile => {
  const filePath = path.join(mobsDir, xmlFile);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Знаходимо всіх рейд-босів
  const npcMatches = [...content.matchAll(/<npc\s+id="(\d+)"\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/npc>/g)];
  
  npcMatches.forEach(match => {
    const fullMatch = match[0];
    const npcIdMatch = fullMatch.match(/id="(\d+)"/);
    const npcNameMatch = fullMatch.match(/name="([^"]+)"/);
    const titleMatch = fullMatch.match(/title="([^"]+)"/);
    
    if (!npcIdMatch || !npcNameMatch) return;
    
    const npcId = npcIdMatch[1];
    const npcName = npcNameMatch[1];
    const isRaidBoss = titleMatch && titleMatch[1].includes('Raid Boss');
    
    // Отримуємо повний контент NPC
    const npcEndIndex = content.indexOf('</npc>', match.index);
    const npcContent = content.substring(match.index, npcEndIndex + 6);
    
    // Перевіряємо, чи це рейд-бос
    if (!isRaidBoss && !npcContent.includes('type="RaidBoss"')) {
      return;
    }
    
    // Отримуємо рівень
    const levelMatch = npcContent.match(/<set\s+name="level"\s+val="(\d+)"\s*\/?>/);
    if (!levelMatch) return;
    
    const level = parseInt(levelMatch[1]);
    
    // Перевіряємо, чи це один з наших рівнів
    if (!ourRaidBossLevels.includes(level)) {
      return;
    }
    
    // Парсимо дропи
    const drops = [];
    const dropsMatch = npcContent.match(/<drops>([\s\S]*?)<\/drops>/);
    if (dropsMatch) {
      const dropsContent = dropsMatch[1];
      const dropMatches = [...dropsContent.matchAll(/<drop\s+itemid="(\d+)"\s+min="(\d+)"\s+max="(\d+)"\s+chance="(\d+)"\s*\/?>/g)];
      
      dropMatches.forEach(dropMatch => {
        const [, itemId, min, max, chance] = dropMatch;
        const itemIdNum = parseInt(itemId);
        const itemIdKey = idToItemId[itemIdNum];
        
        if (itemIdKey) {
          // Конвертуємо chance з XML формату (наприклад, 41197 = 41.197%) в наш формат (0.41197)
          const chancePercent = parseInt(chance) / 1000000;
          
          drops.push({
            itemId: itemIdKey,
            itemIdNum: itemIdNum,
            min: parseInt(min),
            max: parseInt(max),
            chance: chancePercent
          });
        }
      });
    }
    
    if (drops.length > 0) {
      raidBosses.push({
        npcId: parseInt(npcId),
        name: npcName,
        level: level,
        drops: drops
      });
    }
  });
});

// Сортуємо по рівню
raidBosses.sort((a, b) => a.level - b.level);

console.log(`Знайдено ${raidBosses.length} рейд-босів:\n`);

raidBosses.forEach(rb => {
  console.log(`\nLevel ${rb.level}: ${rb.name} (NPC ID: ${rb.npcId})`);
  console.log(`  Drops (${rb.drops.length}):`);
  rb.drops.forEach(drop => {
    console.log(`    - ${drop.itemId} (ID: ${drop.itemIdNum}): ${drop.min}-${drop.max} (${(drop.chance * 100).toFixed(2)}%)`);
  });
});

// Зберігаємо результат
fs.writeFileSync('./tools/raid_boss_drops_from_xml.json', JSON.stringify(raidBosses, null, 2), 'utf8');
console.log(`\n\nРезультат збережено в tools/raid_boss_drops_from_xml.json`);

