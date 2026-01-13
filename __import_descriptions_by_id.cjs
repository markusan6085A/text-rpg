// Fill skill descriptions in TS files using HTML guides by skill id.
// Run: node __import_descriptions_by_id.cjs
const fs = require("fs");
const path = require("path");

const skillsRoot = path.join(__dirname, "src", "data", "skills");
const htmlDirEntry = fs
  .readdirSync(skillsRoot, { withFileTypes: true })
  .find((d) => d.isDirectory() && d.name.toLowerCase().startsWith("маг"));
if (!htmlDirEntry) {
  console.error("HTML directory not found");
  process.exit(1);
}
const htmlDir = path.join(skillsRoot, htmlDirEntry.name);
const tsDir = path.join(skillsRoot, "classes");

const decode = (text) =>
  text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

function extractFromHtml(file) {
  const html = fs.readFileSync(file, "utf8");
  const map = new Map();
  const re =
    /name=['"]skill(\d+)['"][\s\S]*?<tr class="skillstrip">[\s\S]*?<b>([^<]+)<\/b>[\s\S]*?rowspan=2[^>]*>([\s\S]*?)<\/td><\/tr><tr class="skillstrip"><td colspan=['"]4['"][^>]*>([\s\S]*?)<\/td><\/tr>/g;
  let m;
  while ((m = re.exec(html))) {
    const id = parseInt(m[1], 10);
    const desc1 = decode(m[3].replace(/<[^>]+>/g, " "));
    const desc2 = decode(m[4].replace(/<[^>]+>/g, " "));
    const desc = `${desc1} ${desc2}`.trim();
    if (id && desc) map.set(id, desc);
  }
  return map;
}

function buildIdMap() {
  const result = new Map();
  fs.readdirSync(htmlDir, { withFileTypes: true }).forEach((entry) => {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".htm")) return;
    const part = extractFromHtml(path.join(htmlDir, entry.name));
    part.forEach((v, k) => result.set(k, v));
  });
  return result;
}

function updateTs(file, idMap) {
  const original = fs.readFileSync(file, "utf8");
  const idMatch = original.match(/id:\s*(\d+)/);
  if (!idMatch) return false;
  const id = parseInt(idMatch[1], 10);
  const desc = idMap.get(id);
  if (!desc) return false;
  let next = original;
  next = next.replace(/description:\s*`[\s\S]*?`/, `description: "${desc}"`);
  next = next.replace(/description:\s*"[^"]*"/, `description: "${desc}"`);
  next = next.replace(/description:\s*'[^']*'/, `description: "${desc}"`);
  if (next === original) return false;
  fs.writeFileSync(file, next, "utf8");
  return true;
}

function run() {
  const idMap = buildIdMap();
  let updated = 0;
  const walk = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".ts")) {
        if (updateTs(full, idMap)) {
          updated += 1;
          console.log("Updated:", path.relative(tsDir, full));
        }
      }
    });
  };
  walk(tsDir);
  console.log("Done. Updated", updated);
}

run();
