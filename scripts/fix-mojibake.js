#!/usr/bin/env node
/**
 * Fix double-encoded UTF-8 (mojibake) in mobs.ts
 * UTF-8 was misinterpreted as Latin-1/ISO-8859-1 and re-saved as UTF-8
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fixMojibake(str) {
  try {
    const bytes = Buffer.from([...str].map((c) => c.charCodeAt(0) & 0xff));
    const fixed = bytes.toString("utf8");
    return fixed !== str ? fixed : null;
  } catch {
    return null;
  }
}

function fixFile(filePath) {
  const abs = path.resolve(__dirname, "..", filePath);
  let content = fs.readFileSync(abs, "utf8");
  let changed = false;

  // Replace mojibake in string literals (name: "РњРѕР»РѕРґРѕР№..." etc)
  content = content.replace(/"([^"]+)"/g, (match, inner) => {
    const fixed = fixMojibake(inner);
    if (fixed) {
      changed = true;
      return `"${fixed.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(abs, content, "utf8");
    console.log("Fixed:", filePath);
  } else {
    console.log("No mojibake found:", filePath);
  }
}

fixFile("src/data/world/l2dop/mobs.ts");
