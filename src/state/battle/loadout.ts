import {
  allSkills,
  getSkillDefForProfession,
  getDefaultProfessionForKlass,
  isSkillInProfession,
  normalizeProfessionId,
} from "../../data/skills";
import { AdditionalSkills } from "../../data/skills/additional";
import type { Hero } from "../../types/Hero";
import { getJSON, removeItem, setJSON } from "../persistence";
import { loadBattle, persistBattle } from "./persist";

/**
 * Додаткові скіли з екрану «Доп. скіли» — лишаються в hero.skills для будь-якої професії.
 * Інакше після learn на сервері filterSkillsListForHeroProfession їх зрізає (не в allowlist професії).
 */
export const EXTRA_SKILL_IDS_ALL_PROFESSIONS = new Set(
  Object.values(AdditionalSkills).map((s) => s.id)
);

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

/** Прибирає з панелі неіснуючі / пасивні скіли (після merge або відновлення з heroJson). */
export function sanitizeBattleLoadoutSlots(
  slots: (number | string | null)[],
  hero: Hero
): (number | string | null)[] {
  const learned = new Set(
    (Array.isArray(hero.skills) ? hero.skills : []).map((s: any) => Number(s?.id)).filter((x) => !Number.isNaN(x))
  );
  const pid =
    normalizeProfessionId(hero.profession ?? null) ||
    normalizeProfessionId(getDefaultProfessionForKlass(String(hero.klass ?? ""), hero.race) || "") ||
    null;
  const out = slots.map((slot) => {
    if (slot === null || slot === undefined) return null;
    if (typeof slot === "string") return slot;
    const n = Number(slot);
    if (n === BASE_ATTACK_ID) return BASE_ATTACK_ID;
    if (!learned.has(n)) return null;
    if (pid && !EXTRA_SKILL_IDS_ALL_PROFESSIONS.has(n) && !isSkillInProfession(n, pid)) return null;
    const def = getSkillDefForBattle(hero.profession ?? null, hero.klass, hero.race, n);
    if (!def) return null;
    if (def.category === "passive") return null;
    return n;
  });
  if (!out.length) return [BASE_ATTACK_ID, null];
  if (out[0] === null || out[0] === undefined) out[0] = BASE_ATTACK_ID;
  return out;
}

export function normalizeRawLoadoutSlots(raw: unknown[]): (number | string | null)[] {
  const normalized = raw
    .map((v: any) => (typeof v === "number" || typeof v === "string" || v === null ? v : null))
    .slice(0, MAX_SLOTS);
  if (normalized.length === 0) normalized.push(BASE_ATTACK_ID);
  if (normalized[0] === null || normalized[0] === undefined) normalized[0] = BASE_ATTACK_ID;
  if (!normalized.includes(BASE_ATTACK_ID) && normalized.length < MAX_SLOTS) normalized.push(BASE_ATTACK_ID);
  if (!normalized.includes(null) && normalized.length < MAX_SLOTS) normalized.push(null);
  return normalized;
}

/** true якщо у ключу l2_loadout немає розкладки (очищено сховище) або лише базова атака. */
export function loadoutStorageIsEmptyOrDefault(heroName: string | undefined): boolean {
  if (!heroName) return true;
  const parsed = getJSON<(number | string | null)[] | null>(`l2_loadout_${heroName}`, null);
  if (!Array.isArray(parsed)) return true;
  const nonTrivial = parsed.some((v, idx) => {
    if (v === null || v === undefined) return false;
    if (typeof v === "string") return true;
    const n = Number(v);
    if (!Number.isFinite(n)) return false;
    if (idx === 0 && n === BASE_ATTACK_ID) return false;
    return true;
  });
  return !nonTrivial;
}

/** У панелі є числовий скіл, якого немає у вивчених (після адмін-скидання скілів / зміни класу без professionForLoadout у battle JSON). */
export function battleLoadoutStaleForHero(
  hero: Hero | null | undefined,
  loadoutSlots: (number | string | null)[] | null | undefined
): boolean {
  if (!hero || !Array.isArray(loadoutSlots)) return false;
  const learned = getHeroLearnedSkillNumericIds(hero);
  return loadoutSlots.some(
    (s) => typeof s === "number" && s !== BASE_ATTACK_ID && !learned.has(s)
  );
}

const profNorm = (p: unknown) => String(p ?? "").trim();

/** У слотах є числовий скіл, який не належить поточній професії (навіть якщо він помилково залишився у hero.skills після merge). */
function slotsContainSkillForeignToProfession(
  hero: Hero,
  slots: (number | string | null)[] | null | undefined
): boolean {
  if (!hero?.profession || !Array.isArray(slots)) return false;
  const pid =
    normalizeProfessionId(hero.profession) ||
    normalizeProfessionId(getDefaultProfessionForKlass(String(hero.klass ?? ""), hero.race) || "") ||
    null;
  if (!pid) return false;
  return slots.some((s) => {
    if (typeof s !== "number" || !Number.isFinite(s) || s === BASE_ATTACK_ID) return false;
    if (EXTRA_SKILL_IDS_ALL_PROFESSIONS.has(s)) return false;
    return !isSkillInProfession(s, pid);
  });
}

/**
 * Прибирає бафи/тогли, прив’язані до скілів іншої професії (numeric buff.id = skill id).
 * Не чіпає mob_skill, buffer, gm_bless_scroll та записи без числового id.
 */
export function filterBuffsForHeroProfession(hero: Hero | null | undefined, buffs: any[] | null | undefined): any[] {
  if (!hero?.profession || !Array.isArray(buffs) || buffs.length === 0) return buffs ? [...buffs] : [];
  const pid =
    normalizeProfessionId(hero.profession) ||
    normalizeProfessionId(getDefaultProfessionForKlass(String(hero.klass ?? ""), hero.race) || "") ||
    null;
  if (!pid) return [...buffs];
  return buffs.filter((b) => {
    const src = b?.source;
    if (src === "mob_skill" || src === "buffer" || src === "gm_bless_scroll") return true;
    const sid = b?.id;
    if (typeof sid !== "number" || !Number.isFinite(sid) || sid === 0) return true;
    if (EXTRA_SKILL_IDS_ALL_PROFESSIONS.has(sid)) return true;
    return isSkillInProfession(sid, pid);
  });
}

/** Розсинхрон панелі/бафів після зміни професії або коли панель містить уже невивчені скіли. */
export function professionOrLoadoutMismatchForBattle(
  heroName: string | null | undefined,
  hero: Hero | null | undefined,
  saved: { professionForLoadout?: string; loadoutSlots?: (number | string | null)[] } | null | undefined
): boolean {
  if (!heroName || !hero?.profession) return false;
  const hp = profNorm(hero.profession);
  const savedProfRaw = saved && (saved as any).professionForLoadout != null ? (saved as any).professionForLoadout : "";
  const savedProf = profNorm(savedProfRaw);
  const profMismatch = !!savedProf && savedProf !== hp;
  const staleSaved = battleLoadoutStaleForHero(hero, saved?.loadoutSlots);
  const staleLocal = battleLoadoutStaleForHero(hero, loadLoadout(heroName));
  const foreignSaved = slotsContainSkillForeignToProfession(hero, saved?.loadoutSlots);
  const foreignLocal = slotsContainSkillForeignToProfession(hero, loadLoadout(heroName));
  return profMismatch || staleSaved || staleLocal || foreignSaved || foreignLocal;
}

/**
 * Примусово вирівняти `l2_loadout_*` і battle snapshot під `heroJson.battleLoadoutSlots` (новіший snapshot з API / інший пристрій).
 */
export function applyBattleLoadoutFromHeroJson(hero: Hero | null): void {
  if (!hero?.name) return;
  const raw = (hero as any).heroJson?.battleLoadoutSlots;
  if (!Array.isArray(raw) || raw.length === 0) return;
  const normalized = normalizeRawLoadoutSlots(raw as unknown[]);
  const sanitized = sanitizeBattleLoadoutSlots(normalized, hero);
  saveLoadout(hero.name, sanitized);
  const saved = loadBattle(hero.name) || {};
  persistBattle(
    {
      ...saved,
      loadoutSlots: sanitized,
      professionForLoadout: hero.profession,
      heroName: hero.name,
    },
    hero.name
  );
}

/**
 * Якщо локальний l2_loadout порожній/дефолтний — відновити панель із heroJson.battleLoadoutSlots (після F5/очищення кешу).
 * Не перезаписує активну локальну розкладку на тому ж пристрої.
 */
export function seedBattleLoadoutFromHeroJsonIfNeeded(hero: Hero | null): void {
  if (!hero?.name) return;
  if (!loadoutStorageIsEmptyOrDefault(hero.name)) return;
  applyBattleLoadoutFromHeroJson(hero);
}

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
  const effectiveProfession =
    profession || getDefaultProfessionForKlass(klass || "", race) || null;
  const pid = effectiveProfession ? normalizeProfessionId(effectiveProfession) : null;
  const out: Array<{ id: number; level: number }> = [];
  for (const raw of skills) {
    const id = Number((raw as any).id);
    if (!id) continue;
    const level = Math.max(1, Number((raw as any).level) || 1);
    if (EXTRA_SKILL_IDS_ALL_PROFESSIONS.has(id)) {
      out.push({ id, level });
      continue;
    }
    // Не використовувати !pid как «дозволити усе» — інакше після зміни класу тягнуться чужі скіли.
    if (!pid) continue;
    if (isSkillInProfession(id, pid)) out.push({ id, level });
  }
  return out;
}
