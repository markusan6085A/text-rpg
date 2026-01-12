const fs = require("fs");
const path = require("path");
let changed = 0;
function walk(dir, files=[]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, files);
    else if (entry.isFile() && p.endsWith('.ts')) files.push(p);
  }
  return files;
}
const targets = walk(path.join('src','data','skills','classes'));
for (const file of targets) {
  let text = fs.readFileSync(file, 'utf8');
  const next = text
    .replace(/description:\s*"[^"]*"/g, 'description: "Skill description."')
    .replace(/description:\s*\'[^\']*\'/g, "description: 'Skill description.'");
  if (next !== text) {
    fs.writeFileSync(file, next, 'utf8');
    changed++;
  }
}
console.log('Descriptions normalized in', changed, 'files');
