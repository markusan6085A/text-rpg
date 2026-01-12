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
      if (name.includes('tempest')) {
        console.log(`\n=== Tempest ===`);
        console.log(`ID: ${id}`);
        console.log(`Name: ${skill['@_name']}`);
        console.log(`Levels: ${skill['@_levels']}`);
        
        // Parse tables
        const tables = Array.isArray(skill.table) ? skill.table : (skill.table ? [skill.table] : []);
        for (const table of tables) {
          const tableName = table['@_name'];
          const values = (table['#text'] || '').trim().split(/\s+/).filter(Boolean).slice(0, 10);
          console.log(`Table ${tableName}: ${values.join(', ')}`);
        }
      }
      
      // Clear Mind: skill_1297
      if (id == 1297) {
        console.log(`\n=== Clear Mind ===`);
        console.log(`ID: ${id}`);
        console.log(`Name: ${skill['@_name']}`);
        console.log(`Levels: ${skill['@_levels']}`);
        
        const tables = Array.isArray(skill.table) ? skill.table : (skill.table ? [skill.table] : []);
        for (const table of tables) {
          const tableName = table['@_name'];
          const values = (table['#text'] || '').trim().split(/\s+/).filter(Boolean).slice(0, 10);
          console.log(`Table ${tableName}: ${values.join(', ')}`);
        }
      }
    }
  } catch (e) {
    // File not found
  }
}

