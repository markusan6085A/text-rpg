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
      const name = skill['@_name'] || '';
      const id = skill['@_id'];
      
      if (name.toLowerCase().includes('tempest') || 
          name.toLowerCase().includes('death spike') ||
          name.toLowerCase().includes('curse death link') ||
          name.toLowerCase().includes('clear mind')) {
        console.log(`Found: ID ${id}, Name: ${name}`);
      }
    }
  } catch (e) {
    // File not found or error
  }
}

