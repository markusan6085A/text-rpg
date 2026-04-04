/**
 * tools/generateMobDropRegistry.mts
 * Запуск: npx tsx tools/generateMobDropRegistry.mts
 *
 * Генерує server/src/data/drops/mobDropRegistry.generated.json
 * з усіма мобами з усіх зон (поточний стан + tiered loot).
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "server", "src", "data", "drops", "mobDropRegistry.generated.json");

// --- Imitate the browser env for any client code that needs it ---
// (none of the data files need it, but just in case)

// Use pathToFileURL to convert Windows path to file:// URL for ESM dynamic import
import { pathToFileURL } from "url";
const { locations } = await import(pathToFileURL(join(ROOT, "src", "data", "world.ts")).href);

interface DropEntry {
  id: string;
  kind: string;
  chance?: number;
  chancePerMillion?: number;
  min?: number;
  max?: number;
  displayName?: string;
}

interface MobRegistryEntry {
  id: string;
  name: string;
  level: number;
  dropChance: number;
  adenaMin: number;
  adenaMax: number;
  drops: DropEntry[];
  spoil: DropEntry[];
  isFloran: boolean;
  isRaidBoss: boolean;
  zoneId: string;
}

const registry: Record<string, MobRegistryEntry> = {};
let total = 0;

for (const zone of locations) {
  const zoneId: string = zone.id;
  const mobs: any[] = zone.mobs ?? [];

  for (const mob of mobs) {
    if (!mob || !mob.id) continue;

    const key = `${mob.id}::${zoneId}`;
    if (registry[key]) continue; // dedup

    const isFloran =
      String(mob.id).startsWith("fl_") ||
      String(mob.id).includes("floran") ||
      String(mob.id).startsWith("champ_floran");

    const isRaidBoss = !!mob.isRaidBoss;

    // Strip drops to only what server needs (id, kind, chance, min, max, chancePerMillion)
    const cleanDrops = (arr: any[]): DropEntry[] =>
      (arr ?? []).map((d: any) => {
        const e: DropEntry = { id: d.id, kind: d.kind ?? "resource" };
        if (d.chance != null) e.chance = d.chance;
        if (d.chancePerMillion != null) e.chancePerMillion = d.chancePerMillion;
        if (d.min != null) e.min = d.min;
        if (d.max != null) e.max = d.max;
        if (d.displayName) e.displayName = d.displayName;
        return e;
      });

    registry[key] = {
      id: mob.id,
      name: String(mob.name ?? ""),
      level: Number(mob.level ?? 1),
      dropChance: Number(mob.dropChance ?? 0.5),
      adenaMin: Number(mob.adenaMin ?? 0),
      adenaMax: Number(mob.adenaMax ?? 0),
      drops: cleanDrops(mob.drops),
      spoil: cleanDrops(mob.spoil),
      isFloran,
      isRaidBoss,
      zoneId,
    };
    total++;
  }
}

writeFileSync(OUT, JSON.stringify(registry, null, 0), "utf-8");
console.log(`✅ Generated mob drop registry: ${total} entries → ${OUT}`);
