// Parse Dark Mystic base HTML and generate common skill TS files using icon number as id.
// This writes minimal stubs with correct id, name, description (RU), icon.
// Run: node __import_dm_common_icons.cjs
const fs = require("fs");
const path = require("path");

const skillsRoot = path.join(__dirname, "src", "data", "skills");
const htmlPath = path.join(skillsRoot, "маг-скіли", "DarkMystic", "Dark Mystic - База знаний Л2.htm");
const outDir = path.join(skillsRoot, "classes", "DarkMystic", "common");

const decodeEntities = (text) =>
  text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

function parseHtml() {
  const html = fs.readFileSync(htmlPath, "utf8");
  const re =
    /<tr class="skillstrip">[\s\S]*?skill(\d+)\.gif'[^>]*alt='([^']*)'[\s\S]*?<b>([^<]+)<\/b>[\s\S]*?<\/tr>\s*<tr class="skillstrip">[\s\S]*?<td colspan=['"]4['"][^>]*>([\s\S]*?)<\/td>\s*<\/tr>/g;
  const items = [];
  let m;
  while ((m = re.exec(html))) {
    const id = parseInt(m[1], 10);
    const altName = decodeEntities(m[2]);
    const bName = decodeEntities(m[3]);
    const desc = decodeEntities(m[4].replace(/<[^>]+>/g, " "));
    const name = decodeEntities((altName || bName || "").replace(/\blv\.?\s*\d+/gi, "").replace(/\s+/g, " "));
    if (!id || !name) continue;
    items.push({ id, name, description: desc, icon: `/skills/skill${id}.gif` });
  }
  return items;
}

function cleanDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach((f) => fs.rmSync(path.join(dir, f), { recursive: true, force: true }));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeSkill(sk) {
  const fname = `Skill_${String(sk.id).padStart(4, "0")}.ts`;
  const file = path.join(outDir, fname);
  const code = `import { SkillDefinition } from "../../../types";

export const skill_${sk.id}: SkillDefinition = {
  id: ${sk.id},
  code: "DM_${sk.id}",
  name: "${sk.name}",
  description: "${sk.description.replace(/"/g, '\\"')}",
  icon: "${sk.icon}",
  category: "none",
  powerType: "none",
  target: "enemy",
  scope: "single",
  levels: [{ level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 0 }],
};
`;
  fs.writeFileSync(file, code, "utf8");
  return fname.replace(".ts", "");
}

function writeIndex(files) {
  const lines = files.map((f) => `export * from "./${f}";`);
  fs.writeFileSync(path.join(outDir, "index.ts"), lines.join("\n") + "\n", "utf8");
}

function run() {
  if (!fs.existsSync(htmlPath)) {
    console.error("HTML not found:", htmlPath);
    process.exit(1);
  }
  const items = parseHtml();
  if (!items.length) {
    console.error("No skills parsed");
    process.exit(1);
  }
  ensureDir(outDir);
  cleanDir(outDir);
  const exports = items.map(writeSkill);
  writeIndex(exports);
  console.log("Done. Generated", exports.length, "skills");
}

run();
