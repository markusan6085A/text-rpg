const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync('tmp_rogue_skills.json','utf8'));
const baseDir = path.join('src','data','skills','classes','HumanFighter','Rogue');
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, {recursive:true});

// Метадані для скілів (категорія, опис тощо)
const metaOverrides = {
  4: {category:'buff', powerType:'none', target:'self', scope:'single', description:'Temporary burst of speed.\n\nВременный всплеск скорости.', effects:[{stat:'runSpeed', mode:'flat'}]},
  16: {category:'physical_attack', powerType:'damage', target:'enemy', scope:'single', description:'A potentially deadly attack. This skill may only be used when a dagger is equipped.\n\nПотенциально смертельная атака. Этот навык можно использовать только при экипированном кинжале.'},
  27: {category:'special', powerType:'none', target:'self', scope:'single', description:'Opens doors and chests.\n\nОткрывает двери и сундуки.'},
  56: {category:'physical_attack', powerType:'damage', target:'enemy', scope:'single', description:'A deadly damage-dealing volley from a bow. Over-hit possible.\n\nСмертельный залп из лука, наносящий урон. Возможен оверхит.'},
  96: {category:'physical_attack', powerType:'damage', target:'enemy', scope:'single', description:'Inflicts a serious wound that causes the enemy to bleed momentarily. Usable when a dagger is equipped.\n\nНаносит серьезную рану, которая заставляет врага кровоточить. Используется при экипированном кинжале.'},
  99: {category:'buff', powerType:'none', target:'self', scope:'single', description:'Increases speed of arrow launch.\n\nУвеличивает скорость запуска стрел.', effects:[{stat:'attackSpeed', mode:'percent'}]},
  111: {category:'buff', powerType:'none', target:'self', scope:'single', description:'Significantly increases Evasion.\n\nЗначительно увеличивает Уклонение.', effects:[{stat:'evasion', mode:'flat'}]},
  113: {category:'passive', powerType:'none', target:'self', scope:'single', description:'Increase the range of your bow.\n\nУвеличивает дальность вашего лука.'},
  137: {category:'passive', powerType:'none', target:'self', scope:'single', description:'Critical rate increases.\n\nУвеличивает шанс критического удара.', effects:[{stat:'critRate', mode:'flat'}]},
  148: {category:'passive', powerType:'none', target:'self', scope:'single', description:'Allows quick recovery while one is sitting.\n\nПозволяет быстро восстанавливаться во время сидения.', effects:[{stat:'hpRegen', mode:'flat'}, {stat:'mpRegen', mode:'flat'}]},
  168: {category:'passive', powerType:'none', target:'self', scope:'single', description:'Attack speed increases.\n\nУвеличивает скорость атаки.', effects:[{stat:'attackSpeed', mode:'percent'}]},
  169: {category:'passive', powerType:'none', target:'self', scope:'single', description:'Moving speed increases.\n\nУвеличивает скорость передвижения.', effects:[{stat:'runSpeed', mode:'flat'}]},
  171: {category:'passive', powerType:'none', target:'self', scope:'single', description:'Increases recovery speed while one is running.\n\nУвеличивает скорость восстановления во время бега.', effects:[{stat:'hpRegen', mode:'flat'}, {stat:'mpRegen', mode:'flat'}]},
  193: {category:'passive', powerType:'none', target:'self', scope:'single', description:'Increases the power of a critical attack.\n\nУвеличивает силу критического удара.', effects:[{stat:'critPower', mode:'flat'}]},
  195: {category:'passive', powerType:'none', target:'self', scope:'single', description:'Increases lung capacity.\n\nУвеличивает емкость легких.'},
  198: {category:'passive', powerType:'none', target:'self', scope:'single', description:'Increase evasion.\n\nУвеличивает уклонение.', effects:[{stat:'evasion', mode:'flat'}]},
  208: {category:'passive', powerType:'flat', target:'self', scope:'single', description:'Increases P. Atk. when using a bow.\n\nУвеличивает физ. атаку при использовании лука.', effects:[{stat:'pAtk', mode:'flat'}]},
  209: {category:'passive', powerType:'flat', target:'self', scope:'single', description:'Increases P. Atk. when using a dagger.\n\nУвеличивает физ. атаку при использовании кинжала.', effects:[{stat:'pAtk', mode:'flat'}]},
  225: {category:'passive', powerType:'none', target:'self', scope:'single', description:'Dodging abilities increase when running.\n\nСпособность к уклонению увеличивается при беге.', effects:[{stat:'evasion', mode:'flat'}]},
  227: {category:'passive', powerType:'flat', target:'self', scope:'single', description:'Increases P. Def. when wearing light armor.\n\nУвеличивает физ. защиту при ношении легкой брони.', effects:[{stat:'pDef', mode:'flat'}, {stat:'evasion', mode:'flat'}]},
  256: {category:'buff', powerType:'none', target:'self', scope:'single', description:'Increases one\'s Accuracy. Continuously consumes MP.\n\nУвеличивает точность. Постоянно потребляет MP.', effects:[{stat:'accuracy', mode:'flat'}]},
  312: {category:'buff', powerType:'none', target:'self', scope:'single', description:'Increases one\'s critical attack power. MP will be consumed continuously.\n\nУвеличивает силу критической атаки. MP будет постоянно потребляться.', effects:[{stat:'critPower', mode:'flat'}]},
};

const preferBaseMap = {
  // Можна додати посилання на спільні скіли
};

Object.entries(data).forEach(([idStr, entry])=>{
  const id = parseInt(idStr,10);
  const icon = `/skills/skill${id.toString().padStart(4,'0')}.gif`;
  const code = `HF_${id.toString().padStart(4,'0')}`;
  let levels = entry.levels.map((l)=>({ level:l.level, requiredLevel:l.requiredLevel, spCost:l.spCost, mpCost:l.mpCost, power:l.power||0 }));
  const baseImport = preferBaseMap[id];
  let content = '';
  if (baseImport) {
    content += `import { SkillDefinition } from "../../../types";\nimport { Skill_${id.toString().padStart(4,'0')} as base } from "${baseImport}";\n\n`;
    content += `export const Skill_${id.toString().padStart(4,'0')}: SkillDefinition = { ...base, levels: ${JSON.stringify(levels, null, 2)} };\n`;
  } else {
    const meta = metaOverrides[id] || {category:'none', powerType:'none', target:'self', scope:'single', description: entry.name};
    const castTime = entry.castTime || 0;
    const cooldown = entry.cooldown || 0;
    const extra = [];
    if (castTime) extra.push(`  castTime: ${castTime},`);
    if (cooldown) extra.push(`  cooldown: ${cooldown},`);
    const extraBlock = extra.length ? extra.join('\n') + '\n' : '';
    const desc = (meta.description || entry.name).replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const effectsBlock = meta.effects ? `  effects: ${JSON.stringify(meta.effects, null, 2)},\n` : '';
    content += `import { SkillDefinition } from "../../../types";\n\nexport const Skill_${id.toString().padStart(4,'0')}: SkillDefinition = {\n  id: ${id},\n  code: "${code}",\n  name: "${entry.name}",\n  description: "${desc}",\n  icon: "${icon}",\n  category: "${meta.category}",\n  powerType: "${meta.powerType}",\n  target: "${meta.target}",\n  scope: "${meta.scope}",\n${effectsBlock}${extraBlock}  levels: ${JSON.stringify(levels, null, 2)}\n};\n`;
  }
  fs.writeFileSync(path.join(baseDir, `Skill_${id.toString().padStart(4,'0')}.ts`), content, 'utf8');
});
const indexLines = fs.readdirSync(baseDir).filter(f=>f.endsWith('.ts') && f !== 'index.ts').sort().map(f=>`export * from './${f.replace('.ts','')}';`);
fs.writeFileSync(path.join(baseDir,'index.ts'), indexLines.join('\n'), 'utf8');
console.log('written', indexLines.length, 'skills');

