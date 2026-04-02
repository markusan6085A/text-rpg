/**
 * Replaces two-line `const x =\n    "<L2 warm outer frame>"` with L2_WARM_OUTER_FRAME + adds import.
 * Idempotent: skips files that already import l2WarmLayoutClassNames.
 *
 * Import insertion is naive: if the file starts with a multiline `import {` block, run fix-up manually
 * or move the generated import to after the closing `} from "...";`.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcRoot = path.join(root, "src");

const LONG =
  "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";

const BLOCK_RE = new RegExp(
  `const (\\w+) =\\s*\\n\\s*"${LONG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}";`,
  "g"
);

function importPathFromFile(absFile) {
  const dir = path.dirname(absFile);
  const utilsDir = path.join(srcRoot, "utils");
  let rel = path.relative(dir, utilsDir).replace(/\\/g, "/");
  if (!rel.startsWith(".")) rel = "./" + rel;
  return `${rel}/l2WarmLayoutClassNames`;
}

function walkDir(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules") continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walkDir(p, acc);
    else if (/\.(tsx|ts)$/.test(name)) acc.push(p);
  }
  return acc;
}

const skipFiles = new Set([
  path.join(srcRoot, "utils", "l2WarmLayoutClassNames.ts"),
  path.join(srcRoot, "screens", "location", "locationL2ClassNames.ts"),
]);

let changed = 0;
for (const abs of walkDir(srcRoot)) {
  if (skipFiles.has(abs)) continue;
  let s = fs.readFileSync(abs, "utf8");
  if (!s.includes(LONG)) continue;
  if (s.includes("l2WarmLayoutClassNames")) continue;

  const next = s.replace(BLOCK_RE, "const $1 = L2_WARM_OUTER_FRAME;");
  if (next === s) continue;

  const importLine = `import { L2_WARM_OUTER_FRAME } from "${importPathFromFile(abs)}";`;
  const lines = next.split("\n");
  let insertAt = 0;
  let sawImport = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    if (t.startsWith("import ") || t.startsWith("import\t")) {
      insertAt = i + 1;
      sawImport = true;
      continue;
    }
    if (t === "" || t.startsWith("//")) continue;
    if (!sawImport && (t.startsWith("/*") || t.startsWith("*") || t.startsWith("*/"))) continue;
    break;
  }
  lines.splice(insertAt, 0, importLine);
  fs.writeFileSync(abs, lines.join("\n"));
  changed++;
}

console.log(`migrate-l2-warm-frame: updated ${changed} files`);
