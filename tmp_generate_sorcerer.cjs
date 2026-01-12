const fs = require('fs');
const path = require('path');
const sorcData = JSON.parse(fs.readFileSync('tmp_sorcerer_clean.json','utf8'));
const prophetData = require('./tmp_prophet_skills.json');
const baseDir = path.join('src','data','skills','classes','Human Mystic','Sorcerer');
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, {recursive:true});
const metaOverrides = {
  1056:{category:'debuff', powerType:'none', target:'enemy', scope:'single', description:'Отменяет баффы цели.'},
  1072:{category:'debuff', powerType:'none', target:'enemy', scope:'area', description:'Усыпляет нескольких врагов.'},
  1074:{category:'debuff', powerType:'none', target:'enemy', scope:'single', description:'Понижает сопротивление ветру.'},
  1171:{category:'magic_attack', powerType:'damage', target:'enemy', scope:'area', description:'Огненный круг по площади.'},
  1230:{category:'magic_attack', powerType:'damage', target:'enemy', scope:'single', description:'Огненный удар.'},
  1231:{category:'magic_attack', powerType:'damage', target:'enemy', scope:'single', description:'Магическая вспышка.'},
  1232:{category:'buff', powerType:'none', target:'self', scope:'single', description:'Огненная броня.'},
  1233:{category:'debuff', powerType:'none', target:'enemy', scope:'single', description:'Проклятие истощения.'},
  1275:{category:'magic_attack', powerType:'damage', target:'enemy', scope:'single', description:'Удар ауры.'},
  1285:{category:'magic_attack', powerType:'damage', target:'enemy', scope:'single', description:'Семя огня.'},
  1288:{category:'magic_attack', powerType:'damage', target:'enemy', scope:'area', description:'Симфония ауры.'},
  1289:{category:'magic_attack', powerType:'damage', target:'enemy', scope:'area', description:'Инферно.'},
  1292:{category:'magic_attack', powerType:'damage', target:'enemy', scope:'single', description:'Стихийная атака.'},
  1296:{category:'magic_attack', powerType:'damage', target:'enemy', scope:'area', description:'Дождь огня.'},
  1297:{category:'passive', powerType:'none', target:'self', scope:'single', description:'Увеличивает восстановление MP.', effects:[{stat:'mpRegen', mode:'flat'}]},
};
const preferBaseMap = {164:'../Prophet/skill_0164',146:'../Prophet/skill_0146',228:'../Cleric/skill_0228',229:'../Cleric/skill_0229',212:'../Cleric/skill_0212',213:'../Cleric/skill_0213',234:'../Wizard/Skill_0234',249:'../Wizard/Skill_0249',285:'../Wizard/Skill_0285',1069:'../Cleric/skill_1069',1078:'../Cleric/skill_1078',1083:'../Wizard/Skill_1083',1160:'../Wizard/Skill_1160'};
const patchLevels = (id, levels) => {
  const src = prophetData[String(id)];
  if (!src) return levels;
  return levels.map(l=>{
    const match = src.levels.find((x)=>x.level===l.level);
    if (match && (!l.power || l.power===0)) return {...l, power: match.power ?? l.power};
    return l;
  });
};
Object.entries(sorcData).forEach(([idStr, entry])=>{
  const id = parseInt(idStr,10);
  let levels = entry.levels.map(l=>({level:l.level, requiredLevel:l.requiredLevel, spCost:l.spCost, mpCost:l.mpCost, power:l.power||0}));
  levels = patchLevels(id, levels);
  const baseImport = preferBaseMap[id];
  const icon = `/skills/skill${id.toString().padStart(4,'0')}.gif`;
  const code = `HM_${id.toString().padStart(4,'0')}`;
  const first = entry.levels[0] || {};
  const castTime = first.castTime || 0;
  const cooldown = first.cooldown || 0;
  let content = '';
  if (baseImport) {
    content += `import { SkillDefinition } from "../../../types";\nimport { skill_${id.toString().padStart(4,'0')} as base } from "${baseImport}";\n\n`;
    content += `export const skill_${id.toString().padStart(4,'0')}: SkillDefinition = { ...base, levels: ${JSON.stringify(levels, null, 2)} };\n`;
  } else {
    const meta = metaOverrides[id] || {category:'none', powerType:'none', target:'self', scope:'single', description: entry.name};
    let extra='';
    if (castTime) extra += `\n  castTime: ${castTime},`;
    if (cooldown) extra += `\n  cooldown: ${cooldown},`;
    let effectsField='';
    if (meta.effects) effectsField = `\n  effects: ${JSON.stringify(meta.effects, null, 2)},`;
    content += `import { SkillDefinition } from "../../../types";\n\nexport const skill_${id.toString().padStart(4,'0')}: SkillDefinition = {\n  id: ${id},\n  code: "${code}",\n  name: "${entry.name}",\n  description: "${meta.description || entry.name}",\n  icon: "${icon}",\n  category: "${meta.category}",\n  powerType: "${meta.powerType}",\n  target: "${meta.target}",\n  scope: "${meta.scope}",${extra}${effectsField}\n  levels: ${JSON.stringify(levels, null, 2)}\n};\n`;
  }
  fs.writeFileSync(path.join(baseDir, `Skill_${id.toString().padStart(4,'0')}.ts`), content, 'utf8');
});
const indexLines = fs.readdirSync(baseDir).filter(f=>f.endsWith('.ts')).sort().map(f=>`export * from './${f.replace('.ts','')}';`);
fs.writeFileSync(path.join(baseDir,'index.ts'), indexLines.join('\n'), 'utf8');
console.log('done');
