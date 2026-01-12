const fs = require("fs");
const path = require("path");
const data = JSON.parse(fs.readFileSync("tmp_necro_clean.json","utf8").replace(/^\uFEFF/,""));
const baseDir = path.join("src","data","skills","classes","Human Mystic","Necromancer");
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir,{recursive:true});
const preferBaseMap = {
  146:"../Prophet/skill_0146",
  164:"../Prophet/skill_0164",
  212:"../Cleric/skill_0212",
  213:"../Cleric/skill_0213",
  228:"../Cleric/skill_0228",
  229:"../Cleric/skill_0229",
  234:"../Wizard/Skill_0234",
  249:"../Wizard/Skill_0249",
  285:"../Wizard/Skill_0285",
  1069:"../Cleric/skill_1069",
  1151:"../Wizard/Skill_1151",
  1157:"../Wizard/Skill_1157",
  1164:"../common/skill_1164",
  1167:"../Wizard/Skill_1167",
  1168:"../common/skill_1168",
  1222:"../Wizard/Skill_1222"
};
const metaOverrides = {
  1064:{category:"debuff", powerType:"none", target:"enemy", scope:"single", duration:30, chance:80, effects:[{stat:"castSpeed", mode:"percent", value:-50}]},
  1129:{category:"special", powerType:"none", target:"self", scope:"single", description:"Призывает Reanimated Man."},
  1148:{category:"magic_attack", powerType:"damage", target:"enemy", scope:"single", element:"dark"},
  1154:{category:"special", powerType:"none", target:"self", scope:"single", description:"Призывает Corrupted Man."},
  1155:{category:"magic_attack", powerType:"damage", target:"enemy", scope:"area", element:"dark"},
  1156:{category:"debuff", powerType:"none", target:"enemy", scope:"single", duration:30, chance:80, description:"Ослабляет цель."},
  1159:{category:"magic_attack", powerType:"damage", target:"enemy", scope:"single", element:"dark"},
  1163:{category:"debuff", powerType:"none", target:"enemy", scope:"single", duration:30, chance:80, effects:[{stat:"pDef", mode:"percent", value:-20},{stat:"mDef", mode:"percent", value:-20}]},
  1169:{category:"debuff", powerType:"none", target:"enemy", scope:"single", duration:30, chance:80, effects:[{stat:"runSpeed", mode:"percent", value:-50}]},
  1170:{category:"debuff", powerType:"none", target:"enemy", scope:"single", duration:30, chance:80, effects:[{stat:"runSpeed", mode:"percent", value:-90}]},
  1234:{category:"magic_attack", powerType:"damage", target:"enemy", scope:"single", element:"dark", effects:[{stat:"vampirism", mode:"percent", value:10}]},
  1262:{category:"toggle", powerType:"none", target:"self", scope:"single", duration:3600, description:"Перенаправляет часть урона на саммона."},
  1263:{category:"debuff", powerType:"none", target:"enemy", scope:"single", duration:30, chance:80, effects:[{stat:"mDef", mode:"percent", value:-25}]},
  1269:{category:"debuff", powerType:"none", target:"enemy", scope:"single", duration:120, chance:80, effects:[{stat:"attackSpeed", mode:"percent", value:-20},{stat:"runSpeed", mode:"percent", value:-10}]},
  1298:{category:"debuff", powerType:"none", target:"enemy", scope:"area", duration:120, chance:80, effects:[{stat:"runSpeed", mode:"percent", value:-50}]},
  1334:{category:"special", powerType:"none", target:"self", scope:"single", description:"Призывает Cursed Man."},
};

Object.entries(data).forEach(([idStr, entry])=>{
  const id = parseInt(idStr,10);
  const levels = entry.levels.map(l=>({level:l.level, requiredLevel:l.requiredLevel, spCost:l.spCost, mpCost:l.mpCost, power:l.power}));
  const baseImport = preferBaseMap[id];
  const icon = `/skills/skill${id.toString().padStart(4,'0')}.gif`;
  const code = `HM_${id.toString().padStart(4,'0')}`;
  const first = entry.levels[0] || {};
  const castTime = first.castTime || 0;
  const cooldown = first.cooldown || 0;
  let content = '';
  if (baseImport) {
    content += `import { SkillDefinition } from "../../../types";\nimport { skill_${id.toString().padStart(4,'0')} as base } from "${baseImport}";\n\n`;
    content += `export const skill_${id.toString().padStart(4,'0')}: SkillDefinition = { ...base, levels: ${JSON.stringify(levels,null,2)} };\n`;
  } else {
    const meta = metaOverrides[id] || {category:"none", powerType:"none", target:"self", scope:"single", description: entry.name};
    let extra='';
    if (castTime) extra += `\n  castTime: ${castTime},`;
    if (cooldown) extra += `\n  cooldown: ${cooldown},`;
    if (meta.duration) extra += `\n  duration: ${meta.duration},`;
    if (meta.chance) extra += `\n  chance: ${meta.chance},`;
    if (meta.element) extra += `\n  element: "${meta.element}",`;
    let effectsField='';
    if (meta.effects) effectsField = `\n  effects: ${JSON.stringify(meta.effects,null,2)},`;
    const desc = meta.description || entry.name;
    content += `import { SkillDefinition } from "../../../types";\n\nexport const skill_${id.toString().padStart(4,'0')}: SkillDefinition = {\n  id: ${id},\n  code: "${code}",\n  name: "${entry.name}",\n  description: "${desc}",\n  icon: "${icon}",\n  category: "${meta.category}",\n  powerType: "${meta.powerType}",\n  target: "${meta.target}",\n  scope: "${meta.scope}",${extra}${effectsField}\n  levels: ${JSON.stringify(levels,null,2)}\n};\n`;
  }
  const fileName = path.join(baseDir, `Skill_${id.toString().padStart(4,'0')}.ts`);
  fs.writeFileSync(fileName, content, 'utf8');
});
const indexLines = fs.readdirSync(baseDir).filter(f=>f.endsWith('.ts')).sort().map(f=>`export * from './${f.replace('.ts','')}';`);
fs.writeFileSync(path.join(baseDir,'index.ts'), indexLines.join('\n'),'utf8');
console.log('done');
