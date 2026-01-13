const fs = require('fs');
const txt = fs.readFileSync('tools/htmlскіли/Rogue.txt', 'utf8');
const lines = txt.split('\n');
const skills = new Set();

lines.forEach(l => {
  const m = l.match(/^([A-Z][a-zA-Z ]+)\t/);
  if (m) skills.add(m[1]);
});

console.log('Унікальні назви скілів Rogue:');
console.log([...skills].sort().join('\n'));

