import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const root=path.dirname(fileURLToPath(import.meta.url));
let target='';
const walk=(dir)=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name); if(e.isDirectory()) walk(p); else if(e.name.startsWith('Warlock - ')&&e.name.endsWith('.htm')) target=p;}};
walk(path.join(root,'src','data','skills'));
const html=fs.readFileSync(target,'utf8').replace(/\r?\n/g,' ');
const regex=/<tr class="skillstrip">(.*?)<\/tr>\s*<tr class="skillstrip">(.*?)<\/tr>/gis;
let m; while((m=regex.exec(html))){ const comb=m[1]+' '+m[2]; if(comb.includes('Mass Summon Storm Cubic lv.8')){ console.log(comb); const mp=comb.match(/Расход\s*MP:<br\s*\/?>\s*([0-9]+)/i); console.log('mp', mp && mp[1]); break; }}
