import {
  allSkills,
  getSkillDefForProfession,
  getDefaultProfessionForKlass,
  isSkillInProfession,
  normalizeProfessionId,
} from "../../data/skills";

/** Додаткові скіли, дозволені всім професіям (узгоджено з getSkillDef). */
const EXTRA_SKILL_IDS_ALL_PROFESSIONS = new Set([130, 429, 401]);
import { getJSON, removeItem, setJSON } from "../persistence";

export const BASE_ATTACK_ID = 0;
export const MAX_SLOTS = 60;

/**
 * ID вивчених скілів як числа (у JSON/БД id часто приходить рядком).
 * Без цього панель бою при startBattle/setLoadout вважає скіли «не вивченими» і очищає слоти.
 */
export function getHeroLearnedSkillNumericIds(hero: { skills?: any[] } | null | undefined): Set<number> {
  return new Set(
    (hero?.skills ?? [])
      .map((s: any) => Number(s?.id))
      .filter((id: number) => Number.isFinite(id))
  );
}

/** Очищає loadout (викликати при зміні професії) */
export const clearLoadout = (heroName?: string): void => {
  if (!heroName) return;
  removeItem(`l2_loadout_${heroName}`);
};

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

/** Для PK/арени: узгоджено з normalizeToggle — skill.toggle=true має йти як toggle навіть без category */
export function skillDefIsBuff(def: { category?: string } | null | undefined): boolean {
  return def?.category === "buff";
}

export function skillDefIsToggle(def: { category?: string; toggle?: unknown } | null | undefined): boolean {
  if (!def || skillDefIsBuff(def)) return false;
  return normalizeToggle(def);
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

/** Прибирає скіли чужих професій після merge local+server або зміни класу в адмінці. */
export function filterSkillsListForHeroProfession(
  profession: string | null | undefined,
  klass: string | undefined,
  race: string | undefined,
  skills: Array<{ id: number; level?: number }> | null | undefined
): Array<{ id: number; level: number }> {
  if (!Array.isArray(skills) || skills.length === 0) return [];
  const effectiveProfession = profession || getDefaultProfessionForKlass(klass || "", race) || "";
  const pid = normalizeProfessionId(effectiveProfession);
  const out: Array<{ id: number; level: number }> = [];
  for (const raw of skills) {
    const id = Number((raw as any).id);
    if (!id) continue;
    const level = Math.max(1, Number((raw as any).level) || 1);
    if (EXTRA_SKILL_IDS_ALL_PROFESSIONS.has(id)) {
      out.push({ id, level });
      continue;
    }
    if (!pid || isSkillInProfession(id, pid)) out.push({ id, level });
  }
  return out;
}
