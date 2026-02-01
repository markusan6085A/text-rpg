import { allSkills, getSkillDefForProfession, getDefaultProfessionForKlass } from "../../data/skills";
import { getJSON, setJSON } from "../persistence";

export const BASE_ATTACK_ID = 0;
export const MAX_SLOTS = 60;

export const loadLoadout = (heroName?: string): (number | string | null)[] => {
  if (!heroName) return [BASE_ATTACK_ID, null];
  const key = `l2_loadout_${heroName}`;
  const parsed = getJSON<(number | string | null)[] | null>(key, null);
  if (!Array.isArray(parsed)) return [BASE_ATTACK_ID, null];
  const normalized = parsed
    .map((v: any) => (typeof v === "number" || typeof v === "string" || v === null ? v : null))
    .slice(0, MAX_SLOTS);
  if (normalized.length === 0) normalized.push(BASE_ATTACK_ID);
  // Ensure base attack is in the first slot; if absent, place it there.
  if (normalized[0] === null || typeof normalized[0] === "undefined") {
    normalized[0] = BASE_ATTACK_ID;
  }
  // If base attack is missing and there is room, append it.
  if (!normalized.includes(BASE_ATTACK_ID) && normalized.length < MAX_SLOTS) {
    normalized.push(BASE_ATTACK_ID);
  }
  if (!normalized.includes(null) && normalized.length < MAX_SLOTS) normalized.push(null);
  return normalized;
};

export const saveLoadout = (heroName: string | undefined, slots: (number | string | null)[]) => {
  if (!heroName) return;
  const key = `l2_loadout_${heroName}`;
  setJSON(key, slots);
};

export const BASE_ATTACK = { id: BASE_ATTACK_ID, name: "Attack", icon: "/skills/attack.jpg" };
/** Нормалізує toggle до суворого boolean — buff завжди не-toggle, тільки category=toggle явно toggle */
function normalizeToggle(def: { toggle?: unknown; category?: string }): boolean {
  // Buff-скіли НІКОЛИ не toggle — ігноруємо поле toggle якщо category=buff
  if (typeof def.category === "string" && def.category === "buff") return false;
  return (
    def.toggle === true ||
    def.toggle === "true" ||
    (typeof def.category === "string" && def.category === "toggle")
  );
}

export const getSkillDef = (id: number) => {
  const found = allSkills.find((s) => s.id === id);
  if (!found) {
    if ((id === 130 || id === 429 || id === 401)) {
      console.warn(`[getSkillDef] ⚠️ Додатковий скіл ID ${id} не знайдено в allSkills!`, {
        allSkillsCount: allSkills.length,
        allSkillsIds: allSkills.map(s => s.id).slice(0, 20),
        hasAdditionalSkills: allSkills.some(s => s.code?.startsWith("ADD_")),
      });
    }
    return undefined;
  }
  if ((id === 130 || id === 429 || id === 401)) {
    console.log(`[getSkillDef] ✅ Знайдено додатковий скіл: ${found.name} (ID: ${id}, code: ${found.code})`);
  }
  return { ...found, toggle: normalizeToggle(found) };
};

/** Отримує скіл для бою з урахуванням професії — Prophet має buff, OrcShaman toggle для того ж ID */
export const getSkillDefForBattle = (
  profession: string | null,
  klass: string | undefined,
  race: string | undefined,
  skillId: number
) => {
  const effectiveProfession = profession || getDefaultProfessionForKlass(klass || "", race);
  const def = getSkillDefForProfession(effectiveProfession, skillId) ?? getSkillDef(skillId);
  if (!def) return undefined;
  return { ...def, toggle: normalizeToggle(def) };
};
