import fs from 'fs';
import path from 'path';
const filePath = path.join('src','data','skills','маг-скіли','Necromancer - База знаний Л2.htm');
const html = fs.readFileSync(filePath,'utf8');
const text = html.replace(/\r?\n/g,' ');
const anchors = [...text.matchAll(/<a name=['"]level(\d+)['"]/gi)].map(m=>({pos:m.index||0, req:parseInt(m[1],10)})).sort((a,b)=>a.pos-b.pos);
const findReqLevel = (pos)=>{ let req=40; for(const a of anchors){ if(a.pos<=pos) req=a.req; else break; } return req; };
const entries=[];
const regex=/<tr class=\"skillstrip\">(.*?)<\/tr>\s*<tr class=\"skillstrip\">(.*?)<\/tr>/gis;
let m; while((m=regex.exec(text))){ const block=m[1]; const pos=m.index; const iconMatch=block.match(/skill(\d+)\.(?:gif|jpg)/i); if(!iconMatch) continue; const id=parseInt(iconMatch[1],10);
  const altMatch=block.match(/alt='([^']+)'/i); const name=altMatch?altMatch[1].trim():'';
  const bMatch=block.match(/<b>([^<]+)<\/b>/i); const title=bMatch?bMatch[1]:'';
  const levelMatch=title.match(/lv\.\s*([0-9]+)/i); const level=levelMatch?parseInt(levelMatch[1],10):1;
  const spMatch=block.match(/([0-9][0-9 ]*)\s*SP/i); const sp=spMatch?parseInt(spMatch[1].replace(/\s+/g,''),10):0;
  const mpMatch=block.match(/Расход MP:<br\/>\s*([0-9]+)/i); const mp=mpMatch?parseInt(mpMatch[1],10):0;
  const castMatch=block.match(/Каст:\s*([0-9.,]+)/i); const cast=castMatch?parseFloat(castMatch[1].replace(',','.')):0;
  const cdMatch=block.match(/Откат:\s*([0-9.,]+)/i); const cd=cdMatch?parseFloat(cdMatch[1].replace(',','.')):0;
  const powerMatch=block.match(/Power\s*([0-9]+)/i); const power=powerMatch?parseInt(powerMatch[1],10):0;
  const reqLevel=findReqLevel(pos);
  entries.push({id,name,title,level,sp,mp,cast,cd,power,reqLevel,pos});
}
const grouped=new Map();
for(const e of entries){ if(!grouped.has(e.id)) grouped.set(e.id,{name:e.name,id:e.id,levels:[]}); grouped.get(e.id).levels.push({level:e.level, requiredLevel:e.reqLevel, spCost:e.sp, mpCost:e.mp, castTime:e.cast, cooldown:e.cd, power:e.power}); }
for(const v of grouped.values()) v.levels.sort((a,b)=>a.level-b.level);
console.log('skills', grouped.size);
console.log(JSON.stringify(Object.fromEntries([...grouped.entries()].map(([k,v])=>[k,v])),null,2));
