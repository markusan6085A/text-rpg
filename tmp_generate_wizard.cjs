const fs = require('fs');
const path = require('path');
const raw = fs.readFileSync('tmp_wizard.json', 'utf8').replace(/\0/g, '');
const jsonText = raw.split(/\r?\n/).slice(1).join('\n');
const data = JSON.parse(jsonText);
const baseDir = 'src/data/skills/classes/Human Mystic/Wizard';
const relFromWizard = (p) => {
  const full = path.resolve(p);
  const base = path.resolve(baseDir);
  let rel = path.relative(base, full).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
};
const searchExportName = (file) => {
  const content = fs.readFileSync(file, 'utf8');
  const m = content.match(/export const\s+(\w+)/);
  return m ? m[1] : null;
};
const metaOverrides = {
  234: { category: 'passive', powerType: 'none', target: 'self', scope: 'single', description: 'Повышает характеристики при ношении роб.', effects: [{ stat: 'pDef', mode: 'percent' }] },
  285: { category: 'passive', powerType: 'none', target: 'self', scope: 'single', description: 'Увеличивает восстановление MP.', effects: [{ stat: 'mpRegen', mode: 'flat' }] },
  1083: { category: 'debuff', powerType: 'none', target: 'enemy', scope: 'single', description: 'Понижает сопротивление огню.' },
  1111: { category: 'special', powerType: 'none', target: 'self', scope: 'single', description: 'Призывает кота Kat.' },
  1126: { category: 'heal', powerType: 'flat', target: 'ally', scope: 'single', description: 'Восстанавливает MP саммону.' },
  1127: { category: 'heal', powerType: 'flat', target: 'ally', scope: 'single', description: 'Лечит саммона.' },
  1144: { category: 'buff', powerType: 'percent', target: 'ally', scope: 'single', description: 'Увеличивает скорость саммона.' },
  1151: { category: 'heal', powerType: 'flat', target: 'self', scope: 'single', description: 'Поглощает HP из трупа.' },
  1157: { category: 'special', powerType: 'none', target: 'self', scope: 'single', description: 'Преобразует HP в MP.' },
  1160: { category: 'debuff', powerType: 'none', target: 'enemy', scope: 'single', description: 'Замедляет цель.' },
  1167: { category: 'debuff', powerType: 'none', target: 'enemy', scope: 'aoe', description: 'Облако яда.' },
  1172: { category: 'magic_attack', powerType: 'damage', target: 'enemy', scope: 'single', description: 'Магическая атака.' },
  1181: { category: 'magic_attack', powerType: 'damage', target: 'enemy', scope: 'single', description: 'Атака огнем.' },
  1220: { category: 'magic_attack', powerType: 'damage', target: 'enemy', scope: 'single', description: 'Огненный шар.' },
  1222: { category: 'debuff', powerType: 'none', target: 'enemy', scope: 'single', description: 'Понижает точность.' },
  1225: { category: 'special', powerType: 'none', target: 'self', scope: 'single', description: 'Призывает Mew.' },
  1274: { category: 'magic_attack', powerType: 'damage', target: 'enemy', scope: 'single', description: 'Магическая стрела.' },
};
for (const [idStr, entry] of Object.entries(data)) {
  const id = parseInt(idStr, 10);
  const levels = entry.levels.map((l) => ({ level: l.level, requiredLevel: l.requiredLevel, spCost: l.spCost, mpCost: l.mpCost, power: l.power }));
  let filesRaw = '';
  try {
    filesRaw = require('child_process').execSync(`rg "id: \\s*${id}" src/data/skills -l`, { encoding: 'utf8' });
  } catch (e) {
    filesRaw = '';
  }
  const files = Array.from(new Set(filesRaw.trim().split(/\r?\n/).filter(Boolean)));
  let content = '';
  if (files.length) {
    const baseFile = files[0];
    const exportName = searchExportName(baseFile) || `skill_${id.toString().padStart(4, '0')}`;
    const rel = relFromWizard(baseFile);
    content = `import { SkillDefinition } from "../../../types";\nimport { ${exportName} as base } from "${rel}";\n\nexport const skill_${id.toString().padStart(4, '0')}: SkillDefinition = { ...base, levels: ${JSON.stringify(levels, null, 2)} };\n`;
  } else {
    const meta = metaOverrides[id] || { category: 'none', powerType: 'none', target: 'self', scope: 'single', description: '' };
    const castTime = entry.levels[0]?.castTime || 0;
    const cooldown = entry.levels[0]?.cooldown || 0;
    const icon = `/skills/skill${id.toString().padStart(4, '0')}.gif`;
    const code = `HM_${id.toString().padStart(4, '0')}`;
    let extraFields = '';
    if (castTime) extraFields += `\n  castTime: ${castTime},`;
    if (cooldown) extraFields += `\n  cooldown: ${cooldown},`;
    let effectsField = '';
    if (meta.effects) effectsField = `\n  effects: ${JSON.stringify(meta.effects, null, 2)},`;
    content = `import { SkillDefinition } from "../../../types";\n\nexport const skill_${id.toString().padStart(4, '0')}: SkillDefinition = {\n  id: ${id},\n  code: "${code}",\n  name: "${entry.name}",\n  description: "${meta.description || entry.name}",\n  icon: "${icon}",\n  category: "${meta.category}",\n  powerType: "${meta.powerType}",\n  target: "${meta.target}",\n  scope: "${meta.scope}",${extraFields}${effectsField}\n  levels: ${JSON.stringify(levels, null, 2)}\n};\n`;
  }
  const fileName = path.join(baseDir, `Skill_${id.toString().padStart(4, '0')}.ts`);
  fs.writeFileSync(fileName, content, { encoding: 'utf8' });
}
console.log('done');
