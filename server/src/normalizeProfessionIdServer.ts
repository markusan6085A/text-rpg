import allowlist from "./professionSkillAllowlist.json";

const byProfessionId = allowlist.byProfessionId as Record<string, string[]>;
const labelToProfessionId = allowlist.labelToProfessionId as Record<string, string>;
const apiVariantToProfessionId = allowlist.apiVariantToProfessionId as Record<string, string>;

/** Як на клієнті normalizeProfessionId — щоб whitelist професії збігався з гільдією. */
export function normalizeProfessionIdForLearn(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  const lowerEarly = s.toLowerCase();
  if (lowerEarly === "human_fighter_titan") return "human_fighter_dreadnought";
  if (s === "human_mystic_advanced") return "human_mystic_cleric";
  if (s === "human_mystic") return "human_mystic_base";
  if (s === "elven_mystic_base") return "elven_mystic";

  const lower = s.toLowerCase();
  if (labelToProfessionId[lower]) return labelToProfessionId[lower];
  if (apiVariantToProfessionId[lower]) return apiVariantToProfessionId[lower];
  const withUnderscores = lower.replace(/\s+/g, "_");
  if (apiVariantToProfessionId[withUnderscores]) return apiVariantToProfessionId[withUnderscores];
  if (byProfessionId[s]) return s;
  if (byProfessionId[withUnderscores]) return withUnderscores;
  if (byProfessionId[lower]) return lower;
  return null;
}
