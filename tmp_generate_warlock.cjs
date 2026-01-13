const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync('tmp_warlock.json','utf8'));
const baseDir = path.join('src','data','skills','classes','HumanMystic','Warlock');
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, {recursive:true});
const metaOverrides = {
  10:{category:'special', powerType:'none', target:'self', scope:'single', description:'Вызывает Storm Cubic.'},
  1328:{category:'buff', powerType:'none', target:'party', scope:'party', description:'Массовый вызов Storm Cubic для группы.'},
  1279:{category:'special', powerType:'none', target:'self', scope:'single', description:'Призывает Binding Cubic.'},
  1111:{category:'special', powerType:'none', target:'self', scope:'single', description:'Призывает Kat the Cat.'},
  1225:{category:'special', powerType:'none', target:'self', scope:'single', description:'Призывает Mew the Cat.'},
  1276:{category:'special', powerType:'none', target:'self', scope:'single', description:'Призывает Kai the Cat.'},
  1331:{category:'special', powerType:'none', target:'self', scope:'single', description:'Призывает Queen of Cat.'},
  1126:{category:'heal', powerType:'flat', target:'ally', scope:'single', description:'Восстанавливает MP саммона.'},
  1127:{category:'heal', powerType:'flat', target:'ally', scope:'single', description:'Восстанавливает HP саммона.'},
  1139:{category:'buff', powerType:'none', target:'ally', scope:'single', description:'Магический щит саммона.'},
  1140:{category:'buff', powerType:'none', target:'ally', scope:'single', description:'Физический щит саммона.'},
  1141:{category:'buff', powerType:'none', target:'ally', scope:'single', description:'Ускоряет саммона.'},
  1144:{category:'buff', powerType:'none', target:'ally', scope:'single', description:'Повышает скорость передвижения саммона.'},
  1299:{category:'buff', powerType:'none', target:'ally', scope:'single', description:'Щит саммона, сильная защита.'},
  1300:{category:'buff', powerType:'none', target:'ally', scope:'single', description:'Лечит/снимает небольшие эффекты с саммона.'},
  1301:{category:'buff', powerType:'none', target:'ally', scope:'single', description:'Благословение саммона.'},
  143:{category:'passive', powerType:'none', target:'self', scope:'single', description:'Улучшает управление кубиками.'},
  258:{category:'passive', powerType:'none', target:'self', scope:'single', description:'Мастерство легкой брони.'},
};
const preferBaseMap = {
  146:'../Prophet/skill_0146',
  164:'../Prophet/skill_0164',
  212:'../Cleric/skill_0212',
  213:'../Cleric/skill_0213',
  228:'../Cleric/skill_0228',
  229:'../Cleric/skill_0229',
  234:'../Wizard/Skill_0234',
  249:'../Wizard/Skill_0249',
  1262:'../Necromancer/Skill_1262',
};
const withDuration = new Set([1139,1140,1141,1144,1301]);
Object.entries(data).forEach(([idStr, entry])=>{
  const id = parseInt(idStr,10);
  const icon = `/skills/skill${id.toString().padStart(4,'0')}.gif`;
  const code = `HM_${id.toString().padStart(4,'0')}`;
  let levels = entry.levels.map((l)=>({ level:l.level, requiredLevel:l.requiredLevel, spCost:l.spCost, mpCost:l.mpCost, power:l.power||0 }));
  const baseImport = preferBaseMap[id];
  let content = '';
  if (baseImport) {
    content += `import { SkillDefinition } from "../../../types";\nimport { skill_${id.toString().padStart(4,'0')} as base } from "${baseImport}";\n\n`;
    content += `export const skill_${id.toString().padStart(4,'0')}: SkillDefinition = { ...base, levels: ${JSON.stringify(levels, null, 2)} };\n`;
  } else {
    const meta = metaOverrides[id] || {category:'none', powerType:'none', target:'self', scope:'single', description: entry.name};
    const castTime = entry.levels[0]?.castTime || 0;
    const cooldown = entry.levels[0]?.cooldown || 0;
    const duration = (entry.levels.find((l)=>l.duration)||{}).duration || (withDuration.has(id)?1200:0);
    const extra = [];
    if (castTime) extra.push(`  castTime: ${castTime},`);
    if (cooldown) extra.push(`  cooldown: ${cooldown},`);
    if (duration) extra.push(`  duration: ${duration},`);
    const extraBlock = extra.length ? extra.join('\n') + '\n' : '';
    content += `import { SkillDefinition } from "../../../types";\n\nexport const skill_${id.toString().padStart(4,'0')}: SkillDefinition = {\n  id: ${id},\n  code: "${code}",\n  name: "${entry.name}",\n  description: "${meta.description || entry.name}",\n  icon: "${icon}",\n  category: "${meta.category}",\n  powerType: "${meta.powerType}",\n  target: "${meta.target}",\n  scope: "${meta.scope}",\n${extraBlock}  levels: ${JSON.stringify(levels, null, 2)}\n};\n`;
  }
  fs.writeFileSync(path.join(baseDir, `Skill_${id.toString().padStart(4,'0')}.ts`), content, 'utf8');
});
const indexLines = fs.readdirSync(baseDir).filter(f=>f.endsWith('.ts')).sort().map(f=>`export * from './${f.replace('.ts','')}';`);
fs.writeFileSync(path.join(baseDir,'index.ts'), indexLines.join('\n'), 'utf8');
console.log('written', indexLines.length);
