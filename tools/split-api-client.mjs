import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p = path.join(root, "src/utils/api.ts");
const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
const slice = (a, b) => lines.slice(a - 1, b).join("\n") + "\n";
const out = path.join(root, "src/utils/api");
fs.mkdirSync(out, { recursive: true });

fs.writeFileSync(path.join(out, "typesAuthCharacter.ts"), slice(16, 86));

const core = [
  ...lines.slice(0, 10),
  "",
  ...lines.slice(11, 14),
  "",
  ...lines.slice(87, 269),
].join("\n") + "\n";
fs.writeFileSync(path.join(out, "core.ts"), core);

fs.writeFileSync(
  path.join(out, "auth.ts"),
  slice(271, 286)
);
fs.writeFileSync(
  path.join(out, "characters.ts"),
  slice(288, 359) + slice(444, 463) + slice(826, 834) + slice(1527, 1543)
);
fs.writeFileSync(path.join(out, "market.ts"), slice(361, 442));
fs.writeFileSync(path.join(out, "pvpArenaTvt.ts"), slice(464, 824));
fs.writeFileSync(path.join(out, "fishingPremiumNick.ts"), slice(836, 1000));
fs.writeFileSync(path.join(out, "chatConstants.ts"), slice(1002, 1006));
fs.writeFileSync(path.join(out, "chat.ts"), slice(1008, 1123));
fs.writeFileSync(path.join(out, "onlineHeartbeat.ts"), slice(1125, 1156));
fs.writeFileSync(path.join(out, "letters.ts"), slice(1158, 1292));
fs.writeFileSync(path.join(out, "newsForum.ts"), slice(1294, 1414));
fs.writeFileSync(path.join(out, "leaderboardSevenSeals.ts"), slice(1416, 1525));
fs.writeFileSync(path.join(out, "clansPartyWorld.ts"), slice(1544, 1994));
fs.writeFileSync(path.join(out, "admin.ts"), slice(1996, 2543));
console.log("split ok", lines.length);
