const fs = require("fs");
const path = require("path");
const results = [];
const root = "src/data/skills/classes";
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.isFile() && p.endsWith(".ts")) {
      const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
      lines.forEach((line, i) => {
        const m = line.match(/description:\s*\"([^\"]*)\"/);
        if (m && /[A-Za-z]/.test(m[1])) results.push(`${p}:${i + 1}:${m[1]}`);
      });
    }
  }
}
walk(root);
console.log(results.join("\n"));
