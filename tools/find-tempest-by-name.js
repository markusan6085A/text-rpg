import { readFileSync } from 'fs';
import { join } from 'path';
import { XMLParser } from 'fast-xml-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const xmlDir = join(__dirname, '..', 'tools', 'htmlскіли', 'скілил2');
const xmlFiles = ['1200-1299.xml', '1300-1399.xml', '1000-1099.xml', '1100-1199.xml'];

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
      
      // Шукаємо Tempest, Storm, або скіли з power 31-39 та area scope
      if (name.includes('tempest') || 
          name.includes('storm') && name.includes('attack') ||
          (id >= 1280 && id <= 1300)) {
        console.log(`\n=== Found ===`);
        console.log(`ID: ${id}`);
        console.log(`Name: ${skill['@_name']}`);
        console.log(`Levels: ${skill['@_levels']}`);
        
        const tables = Array.isArray(skill.table) ? skill.table : (skill.table ? [skill.table] : []);
        for (const table of tables) {
          const tableName = table['@_name'];
          const values = (table['#text'] || '').trim().split(/\s+/).filter(Boolean).slice(0, 5);
          if (values.length > 0) {
            console.log(`Table ${tableName}: ${values.join(', ')}`);
          }
        }
      }
    }
  } catch (e) {
    // File not found
  }
}

