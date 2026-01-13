import { readFileSync } from 'fs';
import { join } from 'path';
import { XMLParser } from 'fast-xml-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const xmlDir = join(__dirname, '..', 'tools', 'htmlскіли', 'скілил2');
const xmlFiles = ['1200-1299.xml', '1300-1399.xml'];

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

for (const file of xmlFiles) {
  const filePath = join(xmlDir, file);
  try {
    const xml = readFileSync(filePath, 'utf8');
    const root = parser.parse(xml);
    const skills = Array.isArray(root.list.skill) ? root.list.skill : [root.list.skill];
    
    for (const skill of skills) {
      if (!skill) continue;
      const name = (skill['@_name'] || '').toLowerCase();
      const id = skill['@_id'];
      
      // Tempest: area attack, power ~31, castTime 5, cooldown 15
      // Шукаємо скіли з area scope та power близько 31
      const tables = Array.isArray(skill.table) ? skill.table : (skill.table ? [skill.table] : []);
      let powerTable = null;
      let reuseTable = null;
      let castTimeTable = null;
      
      for (const table of tables) {
        const tableName = table['@_name'];
        if (tableName && tableName.includes('power')) {
          powerTable = table;
        }
        if (tableName && tableName.includes('reuse')) {
          reuseTable = table;
        }
        if (tableName && tableName.includes('cast')) {
          castTimeTable = table;
        }
      }
      
      if (powerTable) {
        const powerValues = (powerTable['#text'] || '').trim().split(/\s+/).filter(Boolean);
        const firstPower = parseFloat(powerValues[0]);
        
        // Tempest має power близько 31 на першому рівні
        if (firstPower >= 30 && firstPower <= 35 && powerValues.length >= 10) {
          const reuseValues = reuseTable ? (reuseTable['#text'] || '').trim().split(/\s+/).filter(Boolean) : [];
          const castValues = castTimeTable ? (castTimeTable['#text'] || '').trim().split(/\s+/).filter(Boolean) : [];
          
          // Перевіряємо cooldown (reuse) близько 15 секунд
          const firstReuse = reuseValues[0] ? parseFloat(reuseValues[0]) : 0;
          const firstCast = castValues[0] ? parseFloat(castValues[0]) : 0;
          
          if (firstReuse >= 14 && firstReuse <= 16 && firstCast >= 4 && firstCast <= 6) {
            console.log(`\n=== Possible Tempest ===`);
            console.log(`ID: ${id}`);
            console.log(`Name: ${skill['@_name']}`);
            console.log(`Levels: ${skill['@_levels']}`);
            console.log(`First Power: ${firstPower}`);
            console.log(`First Reuse: ${firstReuse}`);
            console.log(`First Cast: ${firstCast}`);
          }
        }
      }
    }
  } catch (e) {
    // File not found
  }
}

