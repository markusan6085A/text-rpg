import { readFileSync } from 'node:fs';
import { XMLParser } from 'fast-xml-parser';
const [, , file, ...ids] = process.argv;
if (!file || !ids.length) {
  console.error('usage: node tools/skill_export.js <file> <skill id>...');
  process.exit(1);
}
const xml = readFileSync(file, 'utf8');
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
const root = parser.parse(xml);
const skills = root.list.skill;
const lookup = new Map();
for (const skill of Array.isArray(skills) ? skills : [skills]) {
  if (skill) lookup.set(skill['@_id'], skill);
}
const parseTable = (table) => {
  if (!table) return [];
  const text = typeof table === 'string' ? table : table['#text'] || '';
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((x) => (x.includes('.') ? parseFloat(x) : parseInt(x, 10)));
};
const ensureArray = (val) => (Array.isArray(val) ? val : val ? [val] : []);

function printSkill(skill) {
  if (!skill) {
    console.log('skill not found');
    return;
  }
  console.log(`# ${skill['@_id']} ${skill['@_name']} (levels ${skill['@_levels']})`);
  for (const table of ensureArray(skill.table)) {
    const values = parseTable(table);
    console.log(`table ${table['@_name']}: ${values.slice(0, 5).join(', ')}${values.length>5 ? ', ...' : ''}`);
  }
  for (const set of ensureArray(skill.set)) {
    console.log(`set ${set['@_name']} = ${set['@_val']}`);
  }
  for (const add of ensureArray(skill.for?.add)) {
    console.log('add', add['@_stat'], add);
  }
  for (const effect of ensureArray(skill.for?.effect)) {
    console.log('effect', effect['@_stat'], effect);
  }
  console.log('');
}

function main() {
  for (const id of ids) {
    const skill = lookup.get(id);
    printSkill(skill);
  }
}

main();
