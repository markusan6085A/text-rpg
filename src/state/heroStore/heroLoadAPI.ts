// Async function to load hero from API
import { getCharacter, updateCharacter } from "../../utils/api";
import { useCharacterStore } from "../characterStore";
import { useAuthStore } from "../authStore";
import { recalculateAllStats } from "../../utils/stats/recalculateAllStats";
import { fixHeroProfession } from "../../utils/fixProfession";
import { loadBattle, persistBattle } from "../battle/persist";
import { cleanupBuffs, computeBuffedMaxResources } from "../battle/helpers";
import { createNewHero } from "../heroFactory";
import type { Hero } from "../../types/Hero";
import { checkSyncConflict, resolveSyncConflict, getConflictMessage, saveLocalBackup } from "./syncPolicy";
import { loadHero } from "./heroLoad";
import { hydrateHero } from "./heroHydration";
import { readCharacterProgress } from "./heroPersistence";
import { restoreFromPercentOrFallback } from "./restoreResourceFromPercent";
import { getRateLimitRemainingMs, useHeroStore } from "../heroStore";
import {
  applyBattleLoadoutFromHeroJson,
  clearLoadout,
  filterBuffsForHeroProfession,
  filterSkillsListForHeroProfession,
  loadLoadout,
  professionOrLoadoutMismatchForBattle,
  seedBattleLoadoutFromHeroJsonIfNeeded,
} from "../battle/loadout";
import {
  applyWarehouseSlotsFromHeroJson,
  seedWarehouseFromHeroJsonIfStorageEmpty,
} from "../warehouse/warehousePersistence";
import { itemsDB, itemsDBWithStarter } from "../../data/items/itemsDB";
import { EXP_TABLE, getExpToNext, MAX_LEVEL } from "../../data/expTable";
import {
  getDefaultProfessionForKlass,
  getProfessionDefinition,
  normalizeProfessionId,
} from "../../data/skills";

// 🔥 ВИДАЛЕНО: window.__lastServerExp та глобальні змінні
// Тепер використовуємо serverState з heroStore

/**
 * Інакше profession з heroJson на кшталт «Маг» (як клас) відсікає всі скіли у filterSkillsListForHeroProfession
 * після learn-skill, бо getSkillModulesForProfession не знаходить модулів.
 */
function resolveProfessionForSkillFilter(
  serverProfession: string | null | undefined,
  localProfession: string | null | undefined,
  klass: string | undefined,
  race: string | undefined
): string | null {
  const tryOne = (raw: string | null | undefined): string | null => {
    if (!raw || !String(raw).trim()) return null;
    const s = String(raw).trim();
    const pid = normalizeProfessionId(s);
    if (pid && getProfessionDefinition(pid)) return s;
    return null;
  };
  return (
    tryOne(serverProfession) ??
    tryOne(localProfession) ??
    getDefaultProfessionForKlass(klass || "", race)
  );
}

function mergeHeroSkillListsByMaxLevel(
  a: Array<{ id?: number; level?: number }> | undefined,
  b: Array<{ id?: number; level?: number }> | undefined
): Array<{ id: number; level: number }> {
  const skillById = new Map<number, { id: number; level: number }>();
  const ingest = (arr: typeof a) => {
    if (!Array.isArray(arr)) return;
    for (const s of arr) {
      const id = Number((s as any).id);
      if (!id) continue;
      const lvl = Math.max(0, Math.floor(Number((s as any).level) || 0));
      const cur = skillById.get(id);
      if (!cur || cur.level < lvl) skillById.set(id, { id, level: lvl });
    }
  };
  ingest(a);
  ingest(b);
  return Array.from(skillById.values());
}

function normalizeExpToLevelProgress(rawExp: unknown, levelRaw: unknown): number {
  const levelNum = Math.max(1, Math.min(MAX_LEVEL, Number(levelRaw) || 1));
  const need = Math.max(0, Number(getExpToNext(levelNum)) || 0);
  let exp = Math.max(0, Number(rawExp) || 0);

  if (need <= 0 || levelNum >= MAX_LEVEL) return 0;
  const floorTotal = EXP_TABLE[levelNum - 1] ?? 0;
  const ceilTotal = EXP_TABLE[levelNum] ?? floorTotal;
  // Колонка character.exp інколи зберігає cumulative total замість сегмента [0, need) — приводимо до сегмента
  if (ceilTotal > floorTotal && exp >= floorTotal && exp < ceilTotal) {
    exp = exp - floorTotal;
  }
  return Math.max(0, Math.min(exp, Math.max(0, need - 1)));
}

/**
 * Після POST mage-spellbook/turn-in сервер пише heroJson.spellbookGuild; у гілці «local preferred»
 * ми збираємо heroJson з локального snapshot — без цього мерджу UI далі показує «здайте книгу».
 */
function mergeSpellbookGuildFromServer(
  localHeroJson: any,
  serverHeroJson: Record<string, unknown> | null | undefined
): Record<string, boolean> | undefined {
  const l = localHeroJson?.spellbookGuild;
  const s = serverHeroJson?.spellbookGuild;
  const isObj = (x: unknown): x is Record<string, boolean> =>
    Boolean(x) && typeof x === "object" && !Array.isArray(x);
  if (isObj(l) && isObj(s)) return { ...l, ...s };
  if (isObj(s)) return { ...s };
  if (isObj(l)) return { ...l };
  return undefined;
}

/**
 * Чи на сервері є скіл з рівнем вищим за локальний (вивчення/прокачка через POST learn-skill тощо).
 * У такому разі SP у відповіді API може бути меншим за локальний snapshot — не можна брати Math.max(local, server).
 */
function skillsStrictlyAheadOnServer(
  localSkills: Array<{ id: number; level?: number }> | undefined,
  serverSkills: Array<{ id: number; level?: number }> | undefined
): boolean {
  const loc = Array.isArray(localSkills) ? localSkills : [];
  const srv = Array.isArray(serverSkills) ? serverSkills : [];
  const levelById = new Map<number, number>();
  for (const s of loc) {
    const id = Number(s?.id);
    if (!Number.isFinite(id) || id <= 0) continue;
    levelById.set(id, Math.max(0, Math.floor(Number(s?.level) || 0)));
  }
  for (const s of srv) {
    const id = Number(s?.id);
    const lvl = Math.max(0, Math.floor(Number(s?.level) || 0));
    if (!Number.isFinite(id) || id <= 0) continue;
    const prev = levelById.get(id) ?? 0;
    if (lvl > prev) return true;
  }
  return false;
}

/** Рівень для merge: вищий з колонки БД та heroJson (узгоджено з гілкою heroJson нижче). */
function resolveFinalLevelFromServer(character: any, heroData: any): number {
  const colLvl = Math.max(1, Number(character.level ?? 1) || 1);
  const hjLvlRaw = heroData?.level;
  const hjLvl = hjLvlRaw != null && hjLvlRaw !== "" ? Number(hjLvlRaw) : NaN;
  return Number.isFinite(hjLvl) && hjLvl > colLvl ? hjLvl : colLvl;
}

/**
 * Після PUT exp/level часто лише в heroJson; колонка character.exp може бути застарілою/іншої семантики.
 * Не брати Math.max(heroJson, column) — інакше «зелена смуга» після F5 стрибає вгору.
 */
function resolveServerPathExp(character: any, heroData: any, finalLevel: number): number {
  const colLvl = Math.max(1, Number(character.level ?? 1) || 1);
  const hjLvlRaw = heroData?.level;
  const hjLvl = hjLvlRaw != null && hjLvlRaw !== "" ? Number(hjLvlRaw) : NaN;
  const hjExpRaw = heroData?.exp;
  const hasHeroJsonExp =
    hjExpRaw != null &&
    hjExpRaw !== "" &&
    Number.isFinite(Number(hjExpRaw)) &&
    Number(hjExpRaw) >= 0;
  const characterExp = normalizeExpToLevelProgress(character.exp, finalLevel);
  if (!hasHeroJsonExp) return characterExp;
  if (!Number.isFinite(hjLvl) || hjLvl === finalLevel) {
    return normalizeExpToLevelProgress(hjExpRaw, finalLevel);
  }
  if (hjLvl < finalLevel) {
    return characterExp;
  }
  return normalizeExpToLevelProgress(hjExpRaw, finalLevel);
}

/** Сімейство «Плащ Добра» з квест-шопу: після union local+server лишаємо лише найвищий рівень (інакше quest_cloak + quest_cloak_s дають два плаща). */
const QUEST_CLOAK_FAMILY_RANK: Record<string, number> = {
  quest_cloak: 0,
  quest_cloak_c: 1,
  quest_cloak_b: 2,
  quest_cloak_a: 3,
  quest_cloak_s: 4,
};

function normalizeInventoryRowId(it: any): string {
  return String(it?.id ?? it?.itemId ?? "")
    .trim()
    .toLowerCase();
}

function dedupeQuestCloakFamilyInInventory(items: any[]): any[] {
  const entries = items.map((it, idx) => ({ it, idx, id: normalizeInventoryRowId(it) }));
  const cloakRows = entries.filter((e) => QUEST_CLOAK_FAMILY_RANK[e.id] !== undefined);
  if (cloakRows.length <= 1) return items;
  const bestRank = Math.max(...cloakRows.map((e) => QUEST_CLOAK_FAMILY_RANK[e.id] ?? -1));
  const bestId = Object.keys(QUEST_CLOAK_FAMILY_RANK).find((id) => QUEST_CLOAK_FAMILY_RANK[id] === bestRank);
  if (!bestId) return items;
  const drop = new Set<number>();
  for (const e of cloakRows) {
    if (e.id !== bestId) drop.add(e.idx);
  }
  return items.filter((_, idx) => !drop.has(idx));
}

/** Чи предмет стакається. Камні з ЛС (meta.hasLSPassive) — ніколи не стакаються. Зброя/екіп — ніколи (навіть якщо type === "quest"). */
function isStackableItem(it: any): boolean {
  if (it?.meta?.hasLSPassive) return false;
  const rawId = it?.id ?? it?.itemId;
  const typeId = String(rawId ?? "");
  const tid = typeId.toLowerCase();
  const def = itemsDB[rawId] || itemsDBWithStarter[rawId];
  const EQUIP_KINDS = new Set([
    "weapon",
    "armor",
    "helmet",
    "boots",
    "gloves",
    "shield",
    "necklace",
    "ring",
    "earring",
    "jewelry",
    "belt",
    "cloak",
  ]);
  const isEquipmentPiece =
    (def && (EQUIP_KINDS.has(String(def.kind || "")) || def.slot === "weapon")) ||
    tid.includes("_weapon_") ||
    tid === "s_draconic_bow" ||
    tid === "s_angel_slayer";
  if (isEquipmentPiece) return false;
  if (def?.stackable === false) return false;
  const slot = def?.slot ?? it?.slot ?? "";
  const stackableSlots = ["consumable", "resource", "quest"];
  return (
    stackableSlots.includes(slot) ||
    typeId.includes("shot") ||
    typeId.includes("potion") ||
    it?.type === "consumable" ||
    it?.type === "resource" ||
    it?.type === "quest"
  );
}

/** Об'єднує інвентарі local + server — ніколи не губити предмети. Зброя/броня — кожен окремо (count:1).
 * @param opts.preferLocalStackCounts — локальний snapshot **новіший** за сервер: (1) стаки з однаковим ключем — count з локалки, не max;
 * (2) для нестакабельних предметів ключ містить enchantLevel: серверний рядок з тим самим id, але іншою заточкою, відкидаємо,
 * інакше після F5 лишаються і +5 (з API), і +6 (локально) — ніби заточка «відкотилась».
 * @param opts.excludeEquippedKeys — Set ключів (id_enchLvl_) предметів, що зараз одягнені в live-store.
 * Якщо сервер ще не обробив PUT і тримає предмет в inventory — пропускаємо його при merge (інакше предмет
 * опиняється одночасно в equipment і inventory = дублювання x2).
 */
function mergeInventoriesUnion(
  localInv: any[],
  serverInv: any[],
  opts?: { preferLocalStackCounts?: boolean; excludeEquippedKeys?: Set<string> }
): any[] {
  /** GM-шоп і клієнт: shop_<id> та канонічний id — один стак (інакше GET змерджує 1000 з API + 990 локально → знову 1000). */
  const mergeKeyBaseId = (i: any) => {
    const raw = String(i?.id ?? i?.itemId ?? "");
    const noShop = raw.replace(/^shop_/i, "").toLowerCase();
    const pseudo = { ...i, id: noShop };
    return isStackableItem(pseudo) || isStackableItem(i) ? noShop : raw;
  };
  const itemKey = (i: any) =>
    `${mergeKeyBaseId(i)}_${i?.enchantLevel ?? 0}_${(i as any).meta?.hasLSPassive ? "ls" : ""}`;
  const countByKey = (arr: any[]) => {
    const m = new Map<string, number>();
    (arr || []).forEach((it: any) => {
      if (!it || (!it.id && !it.itemId)) return;
      const key = itemKey(it);
      // Зброя/броня/біжутерія: один рядок інвентаря = один екземпляр. Інакше count>1 на одному рядку
      // (баг спойлу/старі дані) при merge давав «подвоєння» після F5.
      if (!isStackableItem(it)) {
        m.set(key, (m.get(key) ?? 0) + 1);
        return;
      }
      if (it.count === undefined || it.count === null) {
        m.set(key, (m.get(key) ?? 0) + 1);
        return;
      }
      const cnt = Math.max(0, Math.floor(Number(it.count)));
      if (cnt <= 0) return;
      m.set(key, (m.get(key) ?? 0) + cnt);
    });
    return m;
  };
  const getBestItem = (arr: any[], key: string) =>
    (arr || []).find((it: any) => it && itemKey(it) === key);
  const localCounts = countByKey(localInv);
  const serverCounts = countByKey(serverInv);
  const allKeys = new Set([...localCounts.keys(), ...serverCounts.keys()]);
  const preferLocal = !!opts?.preferLocalStackCounts;
  if (preferLocal) {
    const localNonStackableIds = new Set<string>();
    (localInv || []).forEach((it: any) => {
      if (!it || (!it.id && !it.itemId)) return;
      if (!isStackableItem(it)) localNonStackableIds.add(String(it.id ?? it.itemId));
    });
    if (localNonStackableIds.size > 0) {
      for (const key of [...allKeys]) {
        if (localCounts.has(key)) continue;
        const srvItem = getBestItem(serverInv, key);
        if (!srvItem || isStackableItem(srvItem)) continue;
        const bid = String(srvItem.id ?? srvItem.itemId ?? "");
        if (bid && localNonStackableIds.has(bid)) allKeys.delete(key);
      }
    }
  }
  const result: any[] = [];
  allKeys.forEach((key) => {
    const lc = localCounts.get(key) ?? 0;
    const sc = serverCounts.get(key) ?? 0;
    const bestItem = getBestItem(localInv, key) ?? getBestItem(serverInv, key);
    // Non-stackable item present only on server, but already equipped in live-store:
    // server inventory is stale (PUT not yet processed) — skip to avoid appearing in both
    // equipment slot AND inventory simultaneously (x2 duplication).
    if (
      lc === 0 && sc > 0 &&
      !isStackableItem(bestItem) &&
      opts?.excludeEquippedKeys?.has(key)
    ) {
      return;
    }
    let total: number;
    if (preferLocal && isStackableItem(bestItem)) {
      // Локальний snapshot новіший — повний авторитет по count (включно з 0 після витрати останнього з стаку).
      total = lc;
    } else if (
      !preferLocal &&
      isStackableItem(bestItem) &&
      lc < sc &&
      (lc > 0 || (Array.isArray(localInv) && localInv.length > 0))
    ) {
      // Сервер ще з старим count, а локально вже списали / прибрали рядок (lc=0, інші слоти інвентаря є).
      total = lc;
    } else {
      total = Math.max(lc, sc);
    }
    if (!bestItem || total <= 0) return;
    const normalized = { ...bestItem, id: bestItem.id ?? bestItem.itemId };
    if (isStackableItem(bestItem)) {
      result.push({ ...normalized, count: total });
    } else {
      // Зброя/броня — кожен екземпляр окремо, точка відображається всюди
      for (let i = 0; i < total; i++) {
        result.push({ ...normalized, count: 1, enchantLevel: normalized.enchantLevel ?? 0 });
      }
    }
  });
  return dedupeQuestCloakFamilyInInventory(result);
}

/** Копія інвентаря/overflow з API без union — коли сервер новіший за localStorage (інший пристрій / екіп). */
function cloneInventorySnapshot(inv: any[] | undefined | null): any[] {
  if (!Array.isArray(inv)) return [];
  return inv.map((row: any) => ({ ...row }));
}

export async function loadHeroFromAPI(): Promise<Hero | null> {
  const authStore = useAuthStore.getState();
  const characterStore = useCharacterStore.getState();

  console.log('[loadHeroFromAPI] Starting, auth:', authStore.isAuthenticated, 'characterId:', characterStore.characterId);

  // If not authenticated, return null
  if (!authStore.isAuthenticated || !characterStore.characterId) {
    console.log('[loadHeroFromAPI] Not authenticated or no characterId, returning null');
    return null;
  }

  // 🔥 Правило №1: під час rate limit cooldown НЕ робимо GET — одразу повертаємо локального героя
  if (getRateLimitRemainingMs() > 0) {
    const localHero = loadHero();
    const hydrated = hydrateHero(localHero);
    if (hydrated) {
      console.warn('[loadHeroFromAPI] Cooldown active, returning local hero without GET');
      return hydrated;
    }
    return localHero ? hydrateHero(localHero) : null;
  }

  try {
    // 🔥 Правило 1: Local-first старт - завантажуємо локальну версію спочатку
    const localHero = loadHero();
    let hydratedLocalHero = hydrateHero(localHero);
    
    // Load character from API
    console.log('[loadHeroFromAPI] Fetching character from API...');
    let character;
    try {
      character = await getCharacter(characterStore.characterId);
    } catch (apiErr: any) {
      // 🔥 При 429 сервер не приймає запити — використовуємо локальну версію, щоб після F5 не відкатилось
      if (apiErr?.status === 429 || apiErr?.message?.includes?.('rate_limit')) {
        console.warn('[loadHeroFromAPI] Rate limit on GET character, using local hero to avoid rollback');
        if (hydratedLocalHero) return hydratedLocalHero;
        return localHero ? hydrateHero(localHero) : null;
      }
      throw apiErr;
    }
    console.log('[loadHeroFromAPI] Character received:', character ? 'success' : 'null', character?.id);
    
    // 🔥 КРИТИЧНО: локальний герой з loadHero() прив'язаний до l2_current_user. При Register l2_current_user ще старий
    // → loadHero повертає героя ІНШОГО акаунта. Merge тоді вибирав local (level 6 > 1) і повертав чужий герой.
    // Тому: merge лише якщо локальний герой належить цьому персонажу (name/username збігаються).
    const charName = String(character?.name ?? '').trim().toLowerCase();
    const localName = String((hydratedLocalHero as any)?.username ?? hydratedLocalHero?.name ?? '').trim().toLowerCase();
    const localBelongsToCharacter = !!(charName && localName && charName === localName);
    if (!localBelongsToCharacter && hydratedLocalHero) {
      console.warn('[loadHeroFromAPI] Local hero belongs to different character (char:', character?.name, 'local:', localName || '(empty)', '), using server');
    }
    if (localBelongsToCharacter && hydratedLocalHero) {
      try {
        const live = useHeroStore.getState().hero;
        const liveName = String(live?.name ?? "").trim().toLowerCase();
        if (live && liveName === charName && Array.isArray(live.inventory)) {
          hydratedLocalHero = {
            ...hydratedLocalHero,
            inventory: live.inventory.map((r: any) => ({ ...r })),
            ...(Array.isArray(live.overflowChest)
              ? { overflowChest: live.overflowChest.map((r: any) => ({ ...r })) }
              : {}),
            // Inject live equipment so that items equipped since loadHeroFromAPI started
            // are not treated as stale — prevents old displaced item appearing in both
            // equipment slot AND inventory simultaneously (x2 duplication bug).
            ...(live.equipment ? { equipment: { ...live.equipment } } : {}),
            ...(live.equipmentEnchantLevels
              ? { equipmentEnchantLevels: { ...live.equipmentEnchantLevels } }
              : {}),
          } as Hero;
        }
      } catch {
        /* ignore */
      }
    }
    // 🔥 КРИТИЧНО: У server path не використовуємо hydratedLocalHero, якщо він належить ІНШОМУ персонажу.
    // Інакше новий герой (Register) підтягував би skills/inventory/gender зі старого — баг.
    // 🔥 Multi-device / online: якщо сервер оновлений після останнього локального збереження — пріоритет snapshot з API
    // (інакше ПК тягне старий екіп/стан із localStorage, навіть після гри на телефоні).
    const serverUpdatedAt = character?.updatedAt ? new Date(character.updatedAt).getTime() : 0;
    const localLastSavedAtOuter = (hydratedLocalHero as any)?.lastSavedAt || 0;
    const heroJsonFromChar = (character as any)?.heroJson;
    const serverRevPrefer = Number(heroJsonFromChar?.heroRevision ?? (character as any)?.heroRevision ?? 0);
    const localRevPrefer = Number(
      (hydratedLocalHero as any)?.heroJson?.heroRevision ??
        (hydratedLocalHero as any)?.heroRevision ??
        0
    );
    // Інший пристрій зробив успішний PUT — ревізія в heroJson зростає; lastSavedAt на ПК може бути «новішим» через автозбереження без узгодженого PUT.
    const serverAheadByRevision =
      localBelongsToCharacter && serverRevPrefer > 0 && serverRevPrefer > localRevPrefer;
    // Не використовувати character.updatedAt як ознаку «heroJson з API новіший», коли вже був локальний save:
    // updatedAt часто росте на heartbeat / ancillary DB touch без зміни inventory → preferServerSnapshot давав clone(server),
    // і соски/скроли/заряди «відкатувались» через хвилину-дві.
    const preferServerSnapshotByTime =
      localBelongsToCharacter &&
      serverUpdatedAt > 0 &&
      localLastSavedAtOuter === 0 &&
      !serverAheadByRevision;
    const preferServerSnapshot = preferServerSnapshotByTime || serverAheadByRevision;
    if (import.meta.env.DEV && serverAheadByRevision && !preferServerSnapshotByTime) {
      console.log("[loadHeroFromAPI] preferServerSnapshot: server heroRevision ahead of local", {
        serverRevPrefer,
        localRevPrefer,
        serverUpdatedAt,
        localLastSavedAtOuter,
      });
    }
    const localHeroForMerge =
      localBelongsToCharacter && !preferServerSnapshot ? hydratedLocalHero : null;
    /** Union інвентаря/бафів/енчантів з localStorage — навіть коли preferServerSnapshot (скіли тоді з API). Інакше F5 губить щойні GM-скроли/заточку. */
    const localSnapshot = localBelongsToCharacter ? hydratedLocalHero : null;
    /** Для стаків: довіряємо локалці, якщо lastSaved ≥ updatedAt (навіть при serverAheadByRevision) або ревізія локально ≥ серверної.
     * Інакше GET після витрати зарядів міг брати Math.max(ік, сік) і відкочувати 1000. */
    const localSaveAtLeastAsNewAsServer =
      localLastSavedAtOuter > 0 &&
      serverUpdatedAt > 0 &&
      localLastSavedAtOuter >= serverUpdatedAt;
    const preferLocalStackableCounts =
      localBelongsToCharacter &&
      (localSaveAtLeastAsNewAsServer ||
        (!serverAheadByRevision &&
          ((serverRevPrefer > 0 && localRevPrefer >= serverRevPrefer) ||
            (serverRevPrefer === 0 && localRevPrefer === 0))));
    
    // 🔥 Єдина логіка: накопичувальні (exp, level, sp, adena, mobsKilled) — "більше" = новіше.
    // Skills — порівнюємо суму рівнів, не кількість (3 скіли рівня 3 краще за 4 скіли рівня 1).
    // Inventory/buffs — не порівнюємо "більше/менше", для них інший критерій.
    // Останній запобіжник: local.lastSavedAt > server.updatedAt → локалка новіша, лишаємо навіть при рівних значеннях.
    if (character && hydratedLocalHero && localBelongsToCharacter) {
      const heroData = character.heroJson as any;
      const serverSkillsArr = Array.isArray(heroData?.skills) ? heroData.skills : [];
      const localSkillsArr = Array.isArray(hydratedLocalHero.skills) ? hydratedLocalHero.skills : [];
      const skillLevelSum = (arr: any[]) => arr.reduce((s, sk) => s + (Number((sk as any).level) || 1), 0);
      const serverSkillLevelsSum = skillLevelSum(serverSkillsArr);
      const localSkillLevelsSum = skillLevelSum(localSkillsArr);
      const serverMobsKilled = Number(heroData?.mobsKilled ?? 0);
      const localMobsKilled = Number((hydratedLocalHero as any).mobsKilled ?? (hydratedLocalHero as any).heroJson?.mobsKilled ?? 0);
      // 🔥 КРИТИЧНО: Всі значення в Number() — API може повертати рядки, інакше localExp > serverExp дає хибний результат
      const finalLevelForCompare = resolveFinalLevelFromServer(character, heroData);
      const serverExp = resolveServerPathExp(character, heroData, finalLevelForCompare);
      const localExp = normalizeExpToLevelProgress(
        hydratedLocalHero.exp ?? (hydratedLocalHero as any).heroJson?.exp ?? 0,
        hydratedLocalHero.level ?? (hydratedLocalHero as any).heroJson?.level ?? 1
      );
      const serverLevel = Number(character.level ?? heroData?.level ?? 1);
      const localLevel = Number(hydratedLocalHero.level ?? (hydratedLocalHero as any).heroJson?.level ?? 1);
      const serverSp = readCharacterProgress(character).sp;
      const localSp = Number(hydratedLocalHero.sp ?? (hydratedLocalHero as any).heroJson?.sp ?? 0);
      const serverAdena = Number(character.adena ?? heroData?.adena ?? 0);
      const localAdena = Number(hydratedLocalHero.adena ?? (hydratedLocalHero as any).heroJson?.adena ?? 0);
      const localLastSavedAt = (hydratedLocalHero as any).lastSavedAt || 0;
      const serverUpdatedAt = character.updatedAt ? new Date(character.updatedAt).getTime() : 0;
      const localNewerByTimestamp = localLastSavedAt > 0 && serverUpdatedAt > 0 && localLastSavedAt >= serverUpdatedAt;

      // 🔥 КРИТИЧНО: Якщо локально є активні бафи (наприклад зі статуї), а на сервері їх немає/менше — лишаємо локальну версію
      // Інакше після loadHeroFromAPI ми перезаписуємо store серверним героєм і бафи "зникають через секунду"
      const now = Date.now();
      const localBuffsFromJson = Array.isArray((hydratedLocalHero as any).heroJson?.heroBuffs) ? (hydratedLocalHero as any).heroJson.heroBuffs : [];
      const localBuffsFromBattle = loadBattle(hydratedLocalHero.name);
      const localBuffsMerged = [...localBuffsFromJson, ...(localBuffsFromBattle?.heroBuffs || [])];
      const localBuffsDeduped = localBuffsMerged.filter((b: any, i: number, arr: any[]) =>
        arr.findIndex((x: any) => (x.id && b.id && x.id === b.id) || (!x.id && !b.id && x.name === b.name)) === i
      );
      const localActiveBuffsCount = cleanupBuffs(localBuffsDeduped, now).length;
      const serverBuffs = Array.isArray(heroData?.heroBuffs) ? heroData.heroBuffs : [];
      const serverActiveBuffsCount = cleanupBuffs(serverBuffs, now).length;
      const localHasActiveBuffsNotOnServer = localActiveBuffsCount > serverActiveBuffsCount && localActiveBuffsCount > 0;

      // 🔥 inventory/equipment — якщо локаль має більше елементів або інший екіп — це теж «прогрес» (інакше F5 відкатує купівлю/екіп)
      const localInvLen = (hydratedLocalHero.inventory?.length ?? 0);
      const serverInvLen = (Array.isArray(heroData?.inventory) ? heroData.inventory : []).length;
      const localEquipKeys = Object.keys(hydratedLocalHero.equipment ?? {}).filter(k => (hydratedLocalHero.equipment as any)?.[k]);
      const serverEquipKeys = Object.keys((heroData?.equipment as Record<string, string>) ?? {}).filter(k => (heroData?.equipment as any)?.[k]);
      const localHasMoreInvOrEquip = localInvLen > serverInvLen || localEquipKeys.length > serverEquipKeys.length;
      // 🔥 КРИТИЧНО: Якщо користувач зняв екіп (ботинки, плащ тощо) — локально менше слотів, сервер має старі. Лишаємо локальну версію.
      const localHasExplicitlyUnequipped = localEquipKeys.length < serverEquipKeys.length && localLastSavedAt > 0;
      // 🔥 УНІВЕРСАЛЬНО: Якщо локаль відрізняється від сервера (екіп/інвентар/бафи) і є збереження — пріоритет локальній версії. F5 ніколи не відкатує прогрес.
      const localDiffersFromServer =
        localLastSavedAt > 0 &&
        (localEquipKeys.length !== serverEquipKeys.length ||
          localInvLen !== serverInvLen ||
          localActiveBuffsCount !== serverActiveBuffsCount);

      const localHasMoreProgress =
        localNewerByTimestamp ||
        localDiffersFromServer ||
        localHasActiveBuffsNotOnServer ||
        localHasExplicitlyUnequipped ||
        localHasMoreInvOrEquip ||
        localExp > serverExp ||
        localLevel > serverLevel ||
        localSp > serverSp ||
        localAdena > serverAdena ||
        localSkillLevelsSum > serverSkillLevelsSum ||
        localMobsKilled > serverMobsKilled;

      const localRev = Number(
        (hydratedLocalHero as any)?.heroJson?.heroRevision ??
          (hydratedLocalHero as any)?.heroRevision ??
          0
      );
      const serverRev = Number(heroData?.heroRevision ?? 0);
      // Локальний rev=0 (старий збережений герой) не означає «адмін оновив»; змішуємо з serverLevel лише коли rev реально ріс або сервер нижчий за локальний lvl.
      const serverRevisionAdvanced =
        serverRev > localRev && (localRev > 0 || serverLevel < localLevel);

      // Не «local preferred», якщо сервер новіший за локальний файл — інакше інший пристрій ніколи не «пробивається» в UI.
      if (localHasMoreProgress && !preferServerSnapshot) {
        const reason = localDiffersFromServer ? 'local differs from server (equip/inv/buffs)' : (localHasExplicitlyUnequipped ? 'local unequipped (fewer slots)' : (localHasActiveBuffsNotOnServer ? 'local has active buffs' : (localNewerByTimestamp ? 'lastSavedAt > server.updatedAt' : 'more progress')));
        console.warn('[loadHeroFromAPI] Local preferred:', reason, localHasActiveBuffsNotOnServer ? { localActiveBuffsCount, serverActiveBuffsCount } : { localLevel, serverLevel, localExp, serverExp, localSp, serverSp, localAdena, serverAdena, localSkillLevelsSum, serverSkillLevelsSum, localMobsKilled, serverMobsKilled });
        // 🔥 Рівень з API не знижуємо через mere heroRevision — лише після admin set-level (поле adminLevelSetAt).
        const localAdminAt = Number((hydratedLocalHero as any)?.heroJson?.adminLevelSetAt ?? 0);
        const serverAdminAt = Number((character.heroJson as any)?.adminLevelSetAt ?? 0);
        const adminDemotedLevel =
          serverLevel < localLevel && serverAdminAt > localAdminAt;
        const demoteToServerLevel = adminDemotedLevel;
        const finalLevel = demoteToServerLevel ? serverLevel : Math.max(localLevel, serverLevel);
        const heroDataForLocal = character.heroJson as any;
        const serverExpVal = Number(heroDataForLocal?.exp ?? character.exp ?? 0);
        const finalExp = demoteToServerLevel
          ? serverExpVal
          : serverLevel > localLevel
            ? serverExpVal
            : Math.max(localExp, serverExpVal);
        const locSpN = Math.max(0, Number(localSp) || 0);
        const srvSpN = Math.max(0, Number(serverSp) || 0);
        const serverLearnedSkill =
          skillsStrictlyAheadOnServer(hydratedLocalHero.skills as any, Array.isArray(heroDataForLocal?.skills) ? heroDataForLocal.skills : []);
        const finalSp =
          serverLearnedSkill && srvSpN < locSpN ? srvSpN : Math.max(locSpN, srvSpN);
        // 🔥 КРИТИЧНО: перераховуємо maxHp/maxMp/maxCp по локальному герою (екіп + скіли), інакше після F5 залишається старий max
        // 🔥 Професію/klass беремо з сервера — адмін міг змінити клас, localStorage має стару
        const serverProfession = heroDataForLocal?.profession ?? heroDataForLocal?.klass;
        const serverKlass = character.classId ?? heroDataForLocal?.classId ?? heroDataForLocal?.klass;
        const rawLocalSrvSkills = heroDataForLocal?.skills;
        const serverProfNorm = String(serverProfession ?? "").trim().toLowerCase();
        const localProfNorm = String(hydratedLocalHero.profession ?? "").trim().toLowerCase();
        const profMismatchServerLocal =
          serverProfNorm !== "" &&
          localProfNorm !== "" &&
          serverProfNorm !== localProfNorm;
        const serverSkillsEmpty =
          Array.isArray(rawLocalSrvSkills) && rawLocalSrvSkills.length === 0;
        // Явний skills: [] після change-class / скидання — завжди брати з сервера, навіть якщо localRev=0 і serverRevisionAdvanced хибний (інакше старі скіли з localStorage повертаються).
        // Зміна професії на сервері — ніколи не union з локальними скілами (skills у JSON може бути undefined в старих записах).
        const takeServerSkillsStrict =
          serverSkillsEmpty ||
          profMismatchServerLocal ||
          (serverRevisionAdvanced && demoteToServerLevel);
        // Якщо в heroJson з API є масив skills (навіть порожній) — це джерело правди; інакше після адмін-скидання локальні скіли «оживали»
        let skillsMergedForFilter: Array<{ id: number; level?: number }>;
        if (takeServerSkillsStrict) {
          skillsMergedForFilter = Array.isArray(rawLocalSrvSkills) ? rawLocalSrvSkills : [];
        } else if (Array.isArray(rawLocalSrvSkills)) {
          skillsMergedForFilter = mergeHeroSkillListsByMaxLevel(rawLocalSrvSkills, hydratedLocalHero.skills as any);
        } else {
          skillsMergedForFilter = (hydratedLocalHero.skills as any) || [];
        }
        const klassForSkillFilter =
          (serverKlass && String(serverKlass).trim()) ? String(serverKlass) : hydratedLocalHero.klass;
        const raceForSkillFilter = character.race ?? hydratedLocalHero.race;
        const profForSkillFilter = resolveProfessionForSkillFilter(
          serverProfession,
          hydratedLocalHero.profession,
          klassForSkillFilter,
          raceForSkillFilter
        );
        const skillsAfterProfessionFilter = filterSkillsListForHeroProfession(
          profForSkillFilter,
          klassForSkillFilter,
          raceForSkillFilter,
          skillsMergedForFilter
        );
        const heroForLocalRecalc: Hero = {
          ...hydratedLocalHero,
          level: finalLevel,
          exp: finalExp,
          profession: (serverProfession && String(serverProfession).trim()) ? String(serverProfession) : hydratedLocalHero.profession,
          klass: (serverKlass && String(serverKlass).trim()) ? String(serverKlass) : hydratedLocalHero.klass,
          skills: skillsAfterProfessionFilter,
        };
        const now = Date.now();
        const savedBattle = loadBattle(hydratedLocalHero.name);
        const heroJsonBuffs = Array.isArray((hydratedLocalHero as any).heroBuffs) ? (hydratedLocalHero as any).heroBuffs : Array.isArray((hydratedLocalHero as any).heroJson?.heroBuffs) ? (hydratedLocalHero as any).heroJson.heroBuffs : [];
        const savedBattleBuffs = savedBattle?.heroBuffs || [];
        const allBuffs = [...heroJsonBuffs, ...savedBattleBuffs];
        const byKey = (b: any) => `${b.id ?? ""}_${b.stackType ?? ""}_${b.name ?? ""}`;
        const bestByKey = new Map<string, any>();
        for (const b of allBuffs) {
          const key = byKey(b);
          const cur = bestByKey.get(key);
          const exp = b.expiresAt ?? 0;
          if (!cur || (cur.expiresAt ?? 0) < exp) bestByKey.set(key, b);
        }
        const savedBuffs = cleanupBuffs(Array.from(bestByKey.values()), now);
        const recalculated = recalculateAllStats(heroForLocalRecalc, savedBuffs);
        const baseMax = { maxHp: recalculated.resources.maxHp, maxMp: recalculated.resources.maxMp, maxCp: recalculated.resources.maxCp };
        const buffedMax = computeBuffedMaxResources(baseMax, savedBuffs);
        const heroData = character.heroJson as any;
        const serverMaxHp = heroData?.maxHp != null ? Number(heroData.maxHp) : 0;
        const serverMaxMp = heroData?.maxMp != null ? Number(heroData.maxMp) : 0;
        const serverMaxCp = heroData?.maxCp != null ? Number(heroData.maxCp) : 0;
        const localMaxHp = hydratedLocalHero.maxHp ?? 0;
        const localHp = hydratedLocalHero.hp ?? buffedMax.maxHp;
        const localMaxHpSafeguard = hydratedLocalHero.maxHp ?? buffedMax.maxHp;
        const localHpPercent = localMaxHpSafeguard > 0 ? Math.max(0, Math.min(1, localHp / localMaxHpSafeguard)) : 1;
        const finalHp = Math.round(localHpPercent * buffedMax.maxHp);

        const localMp = hydratedLocalHero.mp ?? buffedMax.maxMp;
        const localMaxMp = hydratedLocalHero.maxMp ?? buffedMax.maxMp;
        const localMpPercent = localMaxMp > 0 ? Math.max(0, Math.min(1, localMp / localMaxMp)) : 1;
        const finalMp = Math.round(localMpPercent * buffedMax.maxMp);

        const localCp = hydratedLocalHero.cp ?? buffedMax.maxCp;
        const localMaxCp = hydratedLocalHero.maxCp ?? buffedMax.maxCp;
        const localCpPercent = localMaxCp > 0 ? Math.max(0, Math.min(1, localCp / localMaxCp)) : 1;
        const finalCp = Math.round(localCpPercent * buffedMax.maxCp);
        
        // Для локально пріоритетного героя відновлюємо HP/MP/CP з урахуванням відсотка від старого макс.,
        // щоб при зміні maxHp (напр. зникли бафи або змінився екіп) відсоток здоров'я зберігався.
        // 🔥 Union з серверним інвентарем — інакше нагороди лише в БД (TvT tvt_coin тощо) губляться: локалка без цих слотів.
        const localInv = hydratedLocalHero?.inventory ?? [];
        const serverInvPreferred = Array.isArray(heroData?.inventory) ? heroData.inventory : [];
        const consolidatedInv = mergeInventoriesUnion(localInv, serverInvPreferred, {
          preferLocalStackCounts: true,
        });
        const localOvPref = Array.isArray((hydratedLocalHero as any).overflowChest)
          ? (hydratedLocalHero as any).overflowChest
          : [];
        const serverOvPref = Array.isArray(heroData?.overflowChest) ? heroData.overflowChest : [];
        const mergedOverflowPreferred = mergeInventoriesUnion(localOvPref, serverOvPref, {
          preferLocalStackCounts: true,
        });
        const localTvtPref = Math.max(
          Number((hydratedLocalHero as any).heroJson?.tvtCoins ?? (hydratedLocalHero as any).heroJson?.tvt_coins ?? 0),
          0
        );
        const serverTvtPref = Math.max(Number(heroData?.tvtCoins ?? heroData?.tvt_coins ?? 0), 0);
        const mergedTvtPreferred = Math.max(localTvtPref, serverTvtPref);
        // 🔥 Як у головному merge: adena = max(локаль, сервер) — інакше продавець (твін) після купівлі лишається зі старою аденою в UI
        const finalAdenaPreferred = Math.max(localAdena, serverAdena);
        const mergedHero: Hero = {
          ...hydratedLocalHero,
          exp: finalExp,
          level: finalLevel,
          sp: finalSp,
          adena: finalAdenaPreferred,
          inventory: consolidatedInv,
          overflowChest: mergedOverflowPreferred,
          name: character.name,
          profession: heroForLocalRecalc.profession,
          klass: heroForLocalRecalc.klass,
          skills: heroForLocalRecalc.skills,
          maxHp: buffedMax.maxHp,
          maxMp: buffedMax.maxMp,
          maxCp: buffedMax.maxCp,
          hp: Math.min(finalHp, buffedMax.maxHp),
          mp: Math.min(finalMp, buffedMax.maxMp),
          cp: Math.min(finalCp, buffedMax.maxCp),
          battleStats: recalculated.baseFinalStats,
        };
        const serverHeroJson = character.heroJson as Record<string, unknown> | null | undefined;
        const serverSeven = serverHeroJson?.sevenSealsBonus;
        const prevMergedHj = (mergedHero as any).heroJson || {};
        const mergedSpellbookGuild = mergeSpellbookGuildFromServer(prevMergedHj, serverHeroJson);
        (mergedHero as any).heroJson = {
          ...prevMergedHj,
          ...(serverSeven && typeof serverSeven === "object"
            ? { sevenSealsBonus: serverSeven }
            : {}),
          ...(Number.isFinite(serverAdminAt) && serverAdminAt > 0 ? { adminLevelSetAt: serverAdminAt } : {}),
          ...(mergedSpellbookGuild ? { spellbookGuild: mergedSpellbookGuild } : {}),
          adena: finalAdenaPreferred,
          inventory: consolidatedInv,
          overflowChest: mergedOverflowPreferred,
          tvtCoins: mergedTvtPreferred,
          tvt_coins: mergedTvtPreferred,
        };
        (mergedHero as any).username = character.name;
        (mergedHero as any).baseMaxHp = recalculated.resources.maxHp;
        (mergedHero as any).baseMaxMp = recalculated.resources.maxMp;
        (mergedHero as any).baseMaxCp = recalculated.resources.maxCp;
        // 🔥 КРИТИЧНО: Оновлюємо serverState.heroRevision перед background save — інакше heroPersistence пропускає PUT (expectedRevision undefined)
        // Без цього Browser 1 з level 7 ніколи не синхронізується → Browser 2 завжди бачить level 1 з API
        const serverRev = (character.heroJson as any)?.heroRevision ?? (character as any)?.heroRevision;
        useHeroStore.getState().updateServerState(
          {
            heroRevision: serverRev != null ? Number(serverRev) : undefined,
            exp: finalExp,
            level: finalLevel,
            sp: finalSp,
            adena: finalAdenaPreferred,
            coinLuck: Number((character as any).coinLuck ?? mergedHero.coinOfLuck ?? 0),
          },
          { revisionFromAuthoritativeGet: true }
        );
        // 🔥 Не спамимо PUT при протухлій сесії — saveHeroToLocalStorage перевірить sessionExpired, але unique skip тут уникає зайвого import
        if (!useAuthStore.getState().sessionExpired) {
          import('./heroPersistence').then(({ saveHeroToLocalStorage }) => {
            if (useAuthStore.getState().sessionExpired) return;
            saveHeroToLocalStorage(mergedHero).catch((err: any) => {
              console.warn('[loadHeroFromAPI] Background push of local hero failed:', err?.message || err);
            });
          });
        }
        if (import.meta.env.DEV) {
          const hj = (mergedHero as any)?.heroJson || {};
          console.log("[LOAD SNAPSHOT]", {
            hp: mergedHero.hp,
            mp: mergedHero.mp,
            cp: mergedHero.cp,
            maxHp: mergedHero.maxHp,
            isDead: hj.isDead,
            deadAt: hj.deadAt,
            buffs: Array.isArray(hj.heroBuffs) ? hj.heroBuffs.length : 0,
            hpPercent: hj.hpPercent,
            mpPercent: hj.mpPercent,
            cpPercent: hj.cpPercent,
          });
        }
        return fixHeroProfession(mergedHero) as Hero;
      }
      
      // 🔥 Перевіряємо конфлікт синхронізації (для інших випадків)
      const conflict = checkSyncConflict(character, hydratedLocalHero);
      if (conflict.hasConflict) {
        const resolution = resolveSyncConflict(conflict);
        const message = getConflictMessage(conflict);
        
        console.warn('[loadHeroFromAPI] Sync conflict detected:', conflict);
        console.log('[loadHeroFromAPI] Resolution:', resolution, message);
        
        // ❗ ВАЖЛИВО: Зберігаємо локальну версію як backup перед заміною
        if (conflict.localNewer) {
          saveLocalBackup(hydratedLocalHero, conflict);
          console.warn('[loadHeroFromAPI] Local version is newer, saved as backup. Using server version for safety.');
        } else if (conflict.serverNewer) {
          console.log('[loadHeroFromAPI] Server version is newer, using server version.');
        }
      }
    }
    
    // 🔥 НЕ славимо heartbeat тут — Layout вже славить через 5 с і кожні 2 хв. Менше запитів = менше 429.
    
    // Якщо character не отримано - повертаємо null (fallback на localStorage)
    if (!character) {
      console.warn('[loadHeroFromAPI] Character not found, returning null for localStorage fallback');
      return null;
    }
    
    // Extract hero data from character.heroJson
    const heroData = character.heroJson as any;

    // 🔥 КРИТИЧНО: Читаємо mobsKilled ДО будь-яких маніпуляцій з heroData
    const mobsKilledFromData = heroData?.mobsKilled ?? heroData?.mobs_killed ?? heroData?.killedMobs ?? heroData?.totalKills ?? undefined;

    // Логуємо mobsKilled для діагностики (завжди, не тільки в DEV)
    console.log('[loadHeroFromAPI] mobsKilled from heroJson:', mobsKilledFromData, 'heroData keys:', heroData ? Object.keys(heroData).slice(0, 20) : 'no heroData');
    
    // Нормалізуємо слот інвентаря з itemsDB (адмінка дає slot "inventory" або "other" — підставляємо правильний)
    // Міграція: видаляємо stats з предметів (бонуси відключені, щоб після F5 не поверталися)
    if (heroData?.inventory && Array.isArray(heroData.inventory)) {
      heroData.inventory = heroData.inventory.map((it: any) => {
        const { stats: _s, ...rest } = it;
        const normalized = rest;
        const rawId = normalized.id || normalized.itemId;
        const lookupId = typeof rawId === "string" ? rawId.trim().toLowerCase() : String(rawId || "");
        const def = lookupId ? itemsDB[lookupId] || itemsDBWithStarter[lookupId] : undefined;
        if (def) {
          const next: any = {
            ...normalized,
            id: def.id,
            name: def.name ?? normalized.name,
            ...(def.grade != null ? { grade: def.grade } : {}),
          };
          if (normalized.slot === "inventory" || !normalized.slot) {
            next.slot = def.slot || "other";
          }
          return next;
        }
        return normalized;
      });
      console.log('[loadHeroFromAPI] Inventory found in heroJson:', {
        count: heroData.inventory.length,
        items: heroData.inventory.map((i: any) => ({ id: i.id, count: i.count, slot: i.slot }))
      });
    } else {
      console.warn('[loadHeroFromAPI] No inventory found in heroJson');
    }
    
    // Check if heroJson is empty or invalid - if so, create a new hero from character data
    let fixedHero: Hero;
    if (!heroData || typeof heroData !== 'object' || Object.keys(heroData).length === 0) {
      console.warn('Empty heroJson in character, creating new hero from character data:', character.id);
      // Create a new hero from character data
      const newHero = createNewHero({
        id: `hero_${Date.now()}`,
        name: character.name,
        username: character.name,
        race: character.race,
        klass: character.classId,
        gender: character.sex,
      });
      fixedHero = fixHeroProfession(newHero);
      // Override with character data (these are the source of truth)
      fixedHero.level = character.level;
      fixedHero.exp = Number(character.exp);
      fixedHero.sp = readCharacterProgress(character).sp;
      // heroJson порожній — newHero вже має стартову адену; колонка character.adena може бути 0 (старий бекенд)
      fixedHero.adena = Math.max(
        Number(newHero.adena ?? 0),
        Number(character.adena ?? 0),
      );
      fixedHero.coinOfLuck = character.coinLuck;
      (fixedHero as any).coins_silver = (character as any).coinsSilver ?? 0;
      fixedHero.aa = character.aa || 0;
      // 🔥 КРИТИЧНО: Зберігаємо mobsKilled, level, exp навіть для нового героя (якщо воно було в heroData)
      const finalMobsKilled = mobsKilledFromData !== undefined ? mobsKilledFromData : 0;
      (fixedHero as any).mobsKilled = finalMobsKilled;
      // 🔥 Схема A: heroJson лише для серіалізації
      // Встановлюємо skills/mobsKilled на верхній рівень hero
      fixedHero.skills = fixedHero.skills || [];
      (fixedHero as any).mobsKilled = finalMobsKilled;
    } else {
      // Merge character data with heroJson
      // 🔥 ВАЖЛИВО: mobsKilled має зберігатися з heroJson (вже прочитано вище)
      const finalMobsKilled = mobsKilledFromData !== undefined ? mobsKilledFromData : 0;
      
      // 🔥 Рівень: колонка БД + heroJson мають узгоджуватись; порівняння тільки через Number (рядки з API).
      const finalLevel = resolveFinalLevelFromServer(character, heroData);
      const finalExp = resolveServerPathExp(character, heroData, finalLevel);
      
      // 🔥 КРИТИЧНО: Не посилатися на fixedHero до його ініціалізації (ReferenceError якщо heroData.skills порожні)
      const serverSkillsArr = Array.isArray((heroData as any).skills) ? (heroData as any).skills : [];
      
      const heroJsonAdena = Number((heroData as any).adena ?? 0);
      const characterAdena = Number(character.adena ?? 0);
      fixedHero = fixHeroProfession({
        ...heroData,
        level: finalLevel,
        exp: finalExp,
        sp: readCharacterProgress(character).sp,
        // Після реєстрації адена в heroJson (createNewHero); колонка БД могла лишатися 0 — не затирати
        adena: Math.max(heroJsonAdena, characterAdena),
        coinOfLuck: character.coinLuck,
        coins_silver: (character as any).coinsSilver ?? 0,
        aa: character.aa || 0,
        name: character.name,
        race: character.race,
        klass: character.classId,
        gender: character.sex,
        skills: serverSkillsArr,
        mobsKilled: finalMobsKilled as any,
      } as Hero);
    }

    // 🔥 Скіли: при новішому snapshot з API не union-мерджити з локалкою — інакше після адмін-скидання / зміни класу старі ID знову в hero.skills та на екрані «Вивчені».
    // Екіп/інвентар як раніше — union далі нижче.
    const rawHeroSkillsMerge = (heroData as any)?.skills;
    let finalSkillsForRecalc: Array<{ id: number; level: number }>;
    if (preferServerSnapshot) {
      const list = Array.isArray(rawHeroSkillsMerge)
        ? rawHeroSkillsMerge
        : Array.isArray((fixedHero as any)?.skills)
          ? (fixedHero as any).skills
          : [];
      finalSkillsForRecalc = filterSkillsListForHeroProfession(
        fixedHero.profession,
        fixedHero.klass,
        fixedHero.race,
        (list as any[])
          .map((s: any) => ({
            id: Number(s?.id),
            level: Math.max(1, Number(s?.level) || 1),
          }))
          .filter((s) => Number.isFinite(s.id) && s.id > 0)
      );
    } else {
      // Явний порожній skills у heroJson (не «поле відсутнє») — не union-мерджити з localStorage, інакше після адмін-зміни класу старі ID лишаються.
      const serverSkillsExplicitlyEmpty =
        Array.isArray(rawHeroSkillsMerge) && rawHeroSkillsMerge.length === 0;
      if (serverSkillsExplicitlyEmpty) {
        finalSkillsForRecalc = filterSkillsListForHeroProfession(
          fixedHero.profession,
          fixedHero.klass,
          fixedHero.race,
          []
        );
      } else {
        const serverProfNorm = String((fixedHero as any).profession ?? "").trim().toLowerCase();
        const localProfNorm = String(localHeroForMerge?.profession ?? "").trim().toLowerCase();
        const profMismatchLocalServer =
          !!localHeroForMerge &&
          serverProfNorm !== "" &&
          localProfNorm !== "" &&
          serverProfNorm !== localProfNorm;
        const serverSkillsForMerge = Array.isArray(rawHeroSkillsMerge) ? rawHeroSkillsMerge : [];
        if (profMismatchLocalServer) {
          const basis = Array.isArray(rawHeroSkillsMerge) ? rawHeroSkillsMerge : (fixedHero.skills || []);
          finalSkillsForRecalc = filterSkillsListForHeroProfession(
            fixedHero.profession,
            fixedHero.klass,
            fixedHero.race,
            basis
          );
        } else {
          const localSkills = localHeroForMerge?.skills || [];
          const skillById = new Map<number, { id: number; level: number }>();
          for (const s of serverSkillsForMerge) {
            const id = Number((s as any).id);
            const lvl = Number((s as any).level) || 1;
            if (id) skillById.set(id, { id, level: lvl });
          }
          for (const s of localSkills) {
            const id = Number((s as any).id);
            const lvl = Number((s as any).level) || 1;
            if (!id) continue;
            const cur = skillById.get(id);
            if (!cur || cur.level < lvl) skillById.set(id, { id, level: lvl });
          }
          finalSkillsForRecalc =
            skillById.size > 0
              ? Array.from(skillById.values()).map(({ id, level }) => ({ id, level }))
              : (fixedHero.skills || []);
          finalSkillsForRecalc = filterSkillsListForHeroProfession(
            fixedHero.profession,
            fixedHero.klass,
            fixedHero.race,
            finalSkillsForRecalc
          );
        }
      }
    }

    // Phase 4: server is authoritative for inventory/equipment/enchants.
    // Phases 1-3 (enchant/equip/shop) write directly to the server atomically,
    // so there is no legitimate reason for localStorage to be ahead for these fields.
    // This eliminates the entire class of rollback/duplication bugs caused by merge conflicts.
    const serverEquip = fixedHero.equipment ?? {};
    const mergedEquipment = serverEquip;

    const serverInv = fixedHero.inventory ?? [];
    const localInv = localSnapshot?.inventory ?? [];
    // For non-server-authoritative stackable items (battle drops, consumables consumed in battle)
    // we still need a merge to avoid losing items that haven't been PUT to server yet.
    // Equipment and enchant levels are fully server-authoritative (phases 1-2).
    // For inventory stackables, prefer server except when local has items from recent battle drops
    // that haven't been committed to server yet (they go through the regular PUT path).
    const equippedKeysForMerge = (() => {
      try {
        const liveNow = useHeroStore.getState().hero;
        const liveNowName = String(liveNow?.name ?? "").trim().toLowerCase();
        if (!liveNow || liveNowName !== charName) return undefined;
        const equip = liveNow.equipment ?? {};
        const enchLvels = liveNow.equipmentEnchantLevels ?? {};
        const s = new Set<string>();
        for (const [slot, itemId] of Object.entries(equip)) {
          if (!itemId) continue;
          const enchLvl = (enchLvels as any)[slot] ?? 0;
          const normalizedId = String(itemId).replace(/^shop_/i, "").toLowerCase();
          s.add(`${normalizedId}_${enchLvl}_`);
        }
        return s.size > 0 ? s : undefined;
      } catch {
        return undefined;
      }
    })();
    // Server always wins for inventory when server is ahead; only keep local items for
    // stackables that local has more of (battle drops not yet PUT to server).
    const mergedInventory = preferServerSnapshot
      ? cloneInventorySnapshot(serverInv)
      : mergeInventoriesUnion(localInv, serverInv, {
          preferLocalStackCounts: preferLocalStackableCounts,
          excludeEquippedKeys: equippedKeysForMerge,
        });

    // Phase 4: equipmentEnchantLevels always from server (enchants go through Phase 1 endpoint)
    const mergedEquipmentEnchantLevels =
      (fixedHero as any).equipmentEnchantLevels ??
      (heroData as any)?.equipmentEnchantLevels ??
      {};

    const localDyes = localSnapshot?.activeDyes ?? [];
    const serverDyes = fixedHero.activeDyes ?? [];
    const mergedActiveDyes = preferServerSnapshot
      ? Array.isArray(serverDyes)
        ? serverDyes.map((d: any) => ({ ...d }))
        : []
      : ((localDyes.length >= serverDyes.length ? localDyes : serverDyes) as any);

    const serverActiveQuests = Array.isArray((heroData as any)?.activeQuests) ? (heroData as any).activeQuests : [];
    const localActiveQuests = Array.isArray(localSnapshot?.activeQuests) ? localSnapshot.activeQuests : [];
    const mergedActiveQuests = serverActiveQuests.length > 0 ? serverActiveQuests : localActiveQuests;

    const serverOverflow = Array.isArray((fixedHero as any).overflowChest) ? (fixedHero as any).overflowChest : [];
    const localOverflow = Array.isArray(localSnapshot?.overflowChest) ? localSnapshot.overflowChest : [];
    const mergedOverflow = preferServerSnapshot
      ? cloneInventorySnapshot(serverOverflow)
      : mergeInventoriesUnion(localOverflow, serverOverflow, {
          preferLocalStackCounts: preferLocalStackableCounts,
        });

    const heroForRecalc: Hero = {
      ...fixedHero,
      skills: finalSkillsForRecalc,
      equipment: mergedEquipment,
      equipmentEnchantLevels: mergedEquipmentEnchantLevels,
      inventory: mergedInventory,
      overflowChest: mergedOverflow,
      activeDyes: mergedActiveDyes,
      activeQuests: mergedActiveQuests,
    };

    // Recalculate stats (same logic as localStorage version)
    const now = Date.now();
    const savedBattle = loadBattle(fixedHero.name);
    
    // 🔥 КРИТИЧНО: Бафи можуть бути в heroJson.heroBuffs (з сервера) або в savedBattle.heroBuffs (localStorage)
    const heroJsonBuffsRaw = Array.isArray((fixedHero as any).heroBuffs)
      ? (fixedHero as any).heroBuffs
      : Array.isArray((fixedHero as any).heroJson?.heroBuffs)
        ? (fixedHero as any).heroJson.heroBuffs
        : [];
    // Зміна професії (локаль vs API), чужі скіли на панелі / у слотах — інакше старі бафи й панель лишаються від попереднього класу
    const profMismatchLocal =
      !!(localBelongsToCharacter && hydratedLocalHero?.profession && fixedHero.profession) &&
      String(hydratedLocalHero!.profession).trim() !== String(fixedHero.profession).trim();
    const professionChanged = !!(
      profMismatchLocal ||
      professionOrLoadoutMismatchForBattle(fixedHero.name, fixedHero as Hero, savedBattle)
    );
    const heroJsonBuffs = professionChanged ? [] : heroJsonBuffsRaw;
    const savedBattleBuffs = professionChanged ? [] : (savedBattle?.heroBuffs || []);
    
    // Об'єднуємо бафи з сервера, battle і heroJson з localStorage (GM-скроли пишуть у heroJson; при preferServerSnapshot раніше втрачалися).
    const localHeroJsonBuffsForMerge =
      !professionChanged &&
      localBelongsToCharacter &&
      Array.isArray((hydratedLocalHero as any)?.heroJson?.heroBuffs)
        ? (hydratedLocalHero as any).heroJson.heroBuffs
        : [];
    const allBuffs = [...heroJsonBuffs, ...savedBattleBuffs, ...localHeroJsonBuffsForMerge];
    const byKey = (b: any) => `${b.id ?? ""}_${b.stackType ?? ""}_${b.name ?? ""}`;
    const bestByKey = new Map<string, any>();
    for (const b of allBuffs) {
      const key = byKey(b);
      const cur = bestByKey.get(key);
      const exp = b.expiresAt ?? 0;
      if (!cur || (cur.expiresAt ?? 0) < exp) bestByKey.set(key, b);
    }
    const uniqueBuffs = Array.from(bestByKey.values());
    const uniqueBuffsForProfession = filterBuffsForHeroProfession(heroForRecalc as Hero, uniqueBuffs);
    const savedBuffs = cleanupBuffs(uniqueBuffsForProfession, now);
    const recalculated = recalculateAllStats(heroForRecalc, []);

    const baseMax = {
      maxHp: recalculated.resources.maxHp,
      maxMp: recalculated.resources.maxMp,
      maxCp: recalculated.resources.maxCp,
    };
    const heroDataAny = heroData as any;
    const serverIsDead = Boolean(heroDataAny?.isDead) || Number(heroDataAny?.deadAt) > 0;
    const localJson = (localSnapshot as any)?.heroJson || {};
    const localIsDead = Boolean(localJson.isDead) || Number(localJson.deadAt || 0) > 0;
    const localHp = Number(localSnapshot?.hp ?? 0);
    // Якщо сервер мертвий, а локально hp > 0 — вважаємо живим (пріоритет живому стану після resurrect)
    const preferLocalAlive = serverIsDead && localHp > 0;
    const isDead = preferLocalAlive ? false : serverIsDead;
    const finalBuffs = isDead ? [] : savedBuffs;
    const buffedMax = computeBuffedMaxResources(baseMax, finalBuffs);
    const finalMaxHp = buffedMax.maxHp;
    const finalMaxMp = buffedMax.maxMp;
    const finalMaxCp = buffedMax.maxCp;

    const oldMaxHp = fixedHero.maxHp ?? 0;
    const oldMaxMp = fixedHero.maxMp ?? 0;
    const oldMaxCp = fixedHero.maxCp ?? 0;
    const newMaxIncreasedHp = recalculated.resources.maxHp > oldMaxHp * 1.05;
    const newMaxIncreasedMp = recalculated.resources.maxMp > oldMaxMp * 1.05;
    const newMaxIncreasedCp = recalculated.resources.maxCp > oldMaxCp * 1.05;
    const fillHp = newMaxIncreasedHp || oldMaxHp <= 0;
    const fillMp = newMaxIncreasedMp || oldMaxMp <= 0;
    const fillCp = newMaxIncreasedCp || oldMaxCp <= 0;

    let finalHp: number;
    let finalMp: number;
    let finalCp: number;
    let isAliveAfterLoad = isDead;
    if (preferLocalAlive) {
      finalHp = Math.min(finalMaxHp, Math.max(1, localHp));
      finalMp = Math.min(finalMaxMp, Math.max(0, Number(localSnapshot?.mp ?? 0)));
      finalCp = Math.min(finalMaxCp, Math.max(0, Number(localSnapshot?.cp ?? 0)));
    } else if (isDead) {
      // Після смерті на F5 — залишаємо 0 HP, доки гравець не воскресне через «У місто».
      finalHp = 0;
      finalMp = 0;
      finalCp = 0;
      isAliveAfterLoad = false;
    } else {
      finalHp = restoreFromPercentOrFallback({
        percentRaw: heroDataAny?.hpPercent,
        fullFlag: Boolean(heroData?.hpFull) || fillHp,
        savedValueRaw: fixedHero.hp,
        savedMaxRaw: heroDataAny?.maxHp,
        finalMax: finalMaxHp,
        isDead: false,
      });
      finalMp = restoreFromPercentOrFallback({
        percentRaw: heroDataAny?.mpPercent,
        fullFlag: Boolean(heroData?.mpFull) || fillMp,
        savedValueRaw: fixedHero.mp,
        savedMaxRaw: heroDataAny?.maxMp,
        finalMax: finalMaxMp,
        isDead: false,
      });
      finalCp = restoreFromPercentOrFallback({
        percentRaw: heroDataAny?.cpPercent,
        fullFlag: Boolean(heroData?.cpFull) || fillCp,
        savedValueRaw: fixedHero.cp,
        savedMaxRaw: heroDataAny?.maxCp,
        finalMax: finalMaxCp,
        isDead: false,
      });
    }

    if (import.meta.env.DEV) {
      console.log("[loadHeroFromAPI] load HP snapshot:", {
        finalMaxHp,
        hpPercent: heroDataAny?.hpPercent,
        finalHp,
        isDead,
        preferLocalAlive: preferLocalAlive || undefined,
      });
    }

    // 🔥 КРИТИЧНО: Зберігаємо mobsKilled з fixedHero і гарантуємо, що воно є в heroJson
    // Перевіряємо всі можливі місця, де може бути mobsKilled
    const currentMobsKilled = (fixedHero as any).mobsKilled ?? 
                              (fixedHero as any).mobs_killed ?? 
                              (fixedHero as any).killedMobs ?? 
                              (fixedHero as any).totalKills ?? 
                              ((fixedHero as any).heroJson?.mobsKilled) ??
                              ((fixedHero as any).heroJson?.mobs_killed) ??
                              ((fixedHero as any).heroJson?.killedMobs) ??
                              ((fixedHero as any).heroJson?.totalKills) ??
                              0;
    const existingHeroJson = (fixedHero as any).heroJson || {};
    
    // Логуємо mobsKilled для діагностики (завжди, не тільки в DEV)
    console.log('[loadHeroFromAPI] mobsKilled before recalc:', currentMobsKilled, 'from fixedHero:', {
      mobsKilled: (fixedHero as any).mobsKilled,
      heroJsonMobsKilled: (fixedHero as any).heroJson?.mobsKilled,
    });
    
    // 🔥 Схема A: hero.* - єдине джерело істини
    // Skills вже об'єднані в finalSkillsForRecalc; використовуємо їх для фінального героя
    const localMobsKilled = (localSnapshot as any)?.mobsKilled ?? 0;
    const serverMobsKilled = mobsKilledFromData ?? 0;
    const finalSkills = finalSkillsForRecalc;
    const finalMobsKilled = localMobsKilled > serverMobsKilled ? localMobsKilled : (serverMobsKilled > 0 ? serverMobsKilled : currentMobsKilled);
    
    // Щоденні завдання: завжди беремо максимум з локального та серверного прогресу, щоб прогрес оновлювався миттєво і не перезаписувався старим API
    const serverProgress = (fixedHero as any).dailyQuestsProgress ?? (heroData as any)?.dailyQuestsProgress ?? {};
    const localProgress = (localSnapshot as any)?.dailyQuestsProgress ?? {};
    const mergedProgress: Record<string, number> = {};
    const allKeys = new Set([...Object.keys(serverProgress || {}), ...Object.keys(localProgress || {})]);
    allKeys.forEach((id) => {
      mergedProgress[id] = Math.max(
        Number((serverProgress as any)?.[id]) || 0,
        Number((localProgress as any)?.[id]) || 0
      );
    });
    // Завжди задаємо dailyQuestsProgress (об'єкт), щоб UI та victory-блок не отримували undefined
    const dailyQuestsProgress: Record<string, number> = Object.keys(mergedProgress).length > 0 ? mergedProgress : {};
    const serverCompleted = (fixedHero as any).dailyQuestsCompleted ?? (heroData as any)?.dailyQuestsCompleted ?? [];
    const localCompleted = (localSnapshot as any)?.dailyQuestsCompleted ?? [];
    const dailyQuestsCompleted = Array.from(new Set([
      ...(Array.isArray(serverCompleted) ? serverCompleted : []),
      ...(Array.isArray(localCompleted) ? localCompleted : []),
    ]));
    const dailyQuestsResetDate = (fixedHero as any).dailyQuestsResetDate ?? (heroData as any)?.dailyQuestsResetDate ?? localSnapshot?.dailyQuestsResetDate;

    // 🔥 КРИТИЧНО: adena — max(локаль, сервер), щоб після продажу GET не перезаписував нову адена старим значенням з API
    // fixedHero.adena може бути 0 при валідному 0 у колонці; heroJson.adena тоді губився через ?? (0 не nullish)
    const serverAdenaVal = Math.max(
      Number(fixedHero.adena ?? 0),
      Number((heroData as any)?.adena ?? 0),
      Number(character.adena ?? 0),
    );
    const localAdenaVal = Number(localSnapshot?.adena ?? (localSnapshot as any)?.heroJson?.adena ?? 0);
    const finalAdena = Math.max(serverAdenaVal, localAdenaVal);

    const heroWithRecalculatedStats: Hero = {
      ...fixedHero,
      adena: finalAdena,
      baseStats: recalculated.originalBaseStats,
      baseStatsInitial: fixedHero.baseStatsInitial || recalculated.originalBaseStats,
      battleStats: recalculated.baseFinalStats,
      maxHp: finalMaxHp,
      maxMp: finalMaxMp,
      maxCp: finalMaxCp,
      hp: finalHp,
      mp: finalMp,
      cp: finalCp,
      skills: finalSkills,
      equipment: mergedEquipment,
      equipmentEnchantLevels: mergedEquipmentEnchantLevels,
      inventory: mergedInventory,
      mobsKilled: finalMobsKilled as any,
      // Адмін: блок/бан — показуємо екран або блокуємо чат
      ...((character as any).blockedUntil ? { blockedUntil: (character as any).blockedUntil } : {}),
      ...((character as any).bannedUntil ? { bannedUntil: (character as any).bannedUntil } : {}),
      // Щоденні завдання та активні квести — завжди встановлюємо, щоб не губити після F5
      dailyQuestsProgress,
      dailyQuestsCompleted,
      ...(dailyQuestsResetDate !== undefined ? { dailyQuestsResetDate } : {}),
      activeQuests: mergedActiveQuests,
    };
    (heroWithRecalculatedStats as any).baseMaxHp = recalculated.resources.maxHp;
    (heroWithRecalculatedStats as any).baseMaxMp = recalculated.resources.maxMp;
    (heroWithRecalculatedStats as any).baseMaxCp = recalculated.resources.maxCp;
    // 🔥 Якщо живий або відновлено 70% після смерті при reload — heroJson isDead: false
    const loadedHeroJson = heroData || (fixedHero as any).heroJson || {};
    (heroWithRecalculatedStats as any).heroJson = {
      ...loadedHeroJson,
      ...(preferLocalAlive || finalHp > 0 || isAliveAfterLoad ? { isDead: false, deadAt: 0 } : {}),
      heroBuffs: isDead && !isAliveAfterLoad ? [] : finalBuffs,
    };

    if (localBelongsToCharacter && hydratedLocalHero) {
      const locLvl = Number(hydratedLocalHero.level ?? (hydratedLocalHero as any)?.heroJson?.level ?? 1);
      const curLvl = Number(heroWithRecalculatedStats.level ?? 1);
      const locAdmMain = Number((hydratedLocalHero as any)?.heroJson?.adminLevelSetAt ?? 0);
      const srvAdmMain = Number((character.heroJson as any)?.adminLevelSetAt ?? 0);
      const adminDemoteMain = srvAdmMain > locAdmMain && curLvl < locLvl;
      if (!adminDemoteMain && locLvl > curLvl) {
        const newExp = normalizeExpToLevelProgress(
          (hydratedLocalHero as any).exp ?? (hydratedLocalHero as any).heroJson?.exp ?? 0,
          locLvl
        );
        const bumpedHero: Hero = {
          ...heroWithRecalculatedStats,
          level: locLvl,
          exp: newExp,
        };
        const re = recalculateAllStats(bumpedHero, savedBuffs);
        const buffed2 = computeBuffedMaxResources(
          {
            maxHp: re.resources.maxHp,
            maxMp: re.resources.maxMp,
            maxCp: re.resources.maxCp,
          },
          savedBuffs
        );
        const hpRatio = finalMaxHp > 0 ? finalHp / finalMaxHp : 1;
        const mpRatio = finalMaxMp > 0 ? finalMp / finalMaxMp : 1;
        const cpRatio = finalMaxCp > 0 ? finalCp / finalMaxCp : 1;
        heroWithRecalculatedStats.level = locLvl;
        heroWithRecalculatedStats.exp = newExp;
        heroWithRecalculatedStats.maxHp = buffed2.maxHp;
        heroWithRecalculatedStats.maxMp = buffed2.maxMp;
        heroWithRecalculatedStats.maxCp = buffed2.maxCp;
        heroWithRecalculatedStats.hp = Math.min(buffed2.maxHp, Math.max(0, Math.round(hpRatio * buffed2.maxHp)));
        heroWithRecalculatedStats.mp = Math.min(buffed2.maxMp, Math.max(0, Math.round(mpRatio * buffed2.maxMp)));
        heroWithRecalculatedStats.cp = Math.min(buffed2.maxCp, Math.max(0, Math.round(cpRatio * buffed2.maxCp)));
        heroWithRecalculatedStats.battleStats = re.baseFinalStats;
        (heroWithRecalculatedStats as any).baseMaxHp = re.resources.maxHp;
        (heroWithRecalculatedStats as any).baseMaxMp = re.resources.maxMp;
        (heroWithRecalculatedStats as any).baseMaxCp = re.resources.maxCp;
        (heroWithRecalculatedStats as any).heroJson = {
          ...(heroWithRecalculatedStats as any).heroJson,
          level: locLvl,
          exp: newExp,
        };
      }
    }
    
    // 🔥 Правило 2: Використовуємо hydrateHero для синхронізації heroJson
    const hydratedHero = hydrateHero(heroWithRecalculatedStats);
    
    // Додаємо heroBuffs до heroJson (вони не в hydrateHero, бо це окрема логіка)
    // 🔥 КРИТИЧНО: Зберігаємо heroRevision з сервера для optimistic locking
    // 🔥 hero.id = character.id для reportMedalDrop/reportRaidBossKill тощо
    if (hydratedHero) {
      (hydratedHero as any).id = character.id;
      (hydratedHero as any).heroRevision = (heroData as any)?.heroRevision || (character as any)?.heroRevision || undefined;
      
      // 🔥 КРИТИЧНО: Синхронізуємо heroBuffs в heroJson; при isDead — бафи пусті
      (hydratedHero as any).heroJson = {
        ...(hydratedHero as any).heroJson,
        heroBuffs: isDead ? [] : savedBuffs,
      };
      
      // 🔥 Логуємо для діагностики
      console.log('[loadHeroFromAPI] Hero loaded with buffs:', {
        heroJsonBuffs: heroJsonBuffs.length,
        savedBattleBuffs: savedBattleBuffs.length,
        uniqueBuffs: savedBuffs.length,
        buffNames: savedBuffs.map((b: any) => b.name || b.id).slice(0, 5),
      });

      // 🔥 КРИТИЧНО: Преміум + Coin of Luck — беремо з локального, якщо там новіший преміум (після покупки F5 не має відкатувати)
      if (localSnapshot) {
        const localPremiumUntil = (localSnapshot as any).premiumUntil ?? (localSnapshot as any).heroJson?.premiumUntil;
        const serverPremiumUntil = (hydratedHero as any).premiumUntil ?? (hydratedHero as any).heroJson?.premiumUntil;
        if (localPremiumUntil != null && Number(localPremiumUntil) > Number(serverPremiumUntil || 0)) {
          (hydratedHero as any).premiumUntil = localPremiumUntil;
          (hydratedHero as any).heroJson = { ...(hydratedHero as any).heroJson, premiumUntil: localPremiumUntil };
          // Після покупки преміуму коіни вже зняті локально — не перезаписувати серверним значенням
          const localCoinOfLuck = (localSnapshot as any).coinOfLuck ?? (localSnapshot as any).heroJson?.coinOfLuck;
          if (localCoinOfLuck !== undefined && localCoinOfLuck !== null) {
            (hydratedHero as any).coinOfLuck = localCoinOfLuck;
            (hydratedHero as any).heroJson = { ...(hydratedHero as any).heroJson, coinOfLuck: localCoinOfLuck };
          }
        }
      }
      // Union інвентаря — завжди при наявній локалці. Якщо пропускати при preferServerSnapshot,
      // клієнт після витрати сосків (PUT ще не встиг) отримував сирий snapshot сервера на GET → відкат x1000.
      if (localSnapshot) {
        const localInv = localSnapshot.inventory ?? [];
        const serverInv = hydratedHero.inventory ?? [];
        const mergedInv = mergeInventoriesUnion(localInv, serverInv, {
          preferLocalStackCounts: preferLocalStackableCounts,
        });
        const localOv = Array.isArray((localSnapshot as any).overflowChest)
          ? (localSnapshot as any).overflowChest
          : [];
        const serverOv = Array.isArray((hydratedHero as any).overflowChest)
          ? (hydratedHero as any).overflowChest
          : [];
        const mergedOv = mergeInventoriesUnion(localOv, serverOv, {
          preferLocalStackCounts: preferLocalStackableCounts,
        });
        const localTvt = Math.max(
          Number(
            (localSnapshot as any).heroJson?.tvtCoins ??
              (localSnapshot as any).heroJson?.tvt_coins ??
              0
          ),
          0
        );
        const serverTvt = Math.max(
          Number(
            (hydratedHero as any).heroJson?.tvtCoins ??
              (hydratedHero as any).heroJson?.tvt_coins ??
              0
          ),
          0
        );
        const mergedTvt = Math.max(localTvt, serverTvt);
        (hydratedHero as any).inventory = mergedInv;
        (hydratedHero as any).overflowChest = mergedOv;
        (hydratedHero as any).heroJson = {
          ...(hydratedHero as any).heroJson,
          inventory: mergedInv,
          overflowChest: mergedOv,
          tvtCoins: mergedTvt,
          tvt_coins: mergedTvt,
        };
        console.log("[loadHeroFromAPI] Applied inventory union merge:", mergedInv.length, "items");

        if (!preferServerSnapshot) {
          const localEquip = localSnapshot.equipment ?? {};
          const serverEquip = hydratedHero.equipment ?? {};
          const localEquipCount = Object.keys(localEquip).filter((k) => localEquip[k] != null).length;
          const serverEquipCount = Object.keys(serverEquip).filter((k) => serverEquip[k] != null).length;
          if (localEquipCount > serverEquipCount) {
            (hydratedHero as any).equipment = localEquip;
            (hydratedHero as any).heroJson = { ...(hydratedHero as any).heroJson, equipment: localEquip };
            console.log(
              "[loadHeroFromAPI] Preferring local equipment (more slots):",
              localEquipCount,
              "vs",
              serverEquipCount
            );
          }
          if (preferLocalStackableCounts) {
            const le = (localSnapshot as any)?.equipmentEnchantLevels ?? {};
            if (le && typeof le === "object" && Object.keys(le).length > 0) {
              const cur = { ...((hydratedHero as any).equipmentEnchantLevels ?? {}) };
              Object.assign(cur, le);
              (hydratedHero as any).equipmentEnchantLevels = cur;
              const hj = (hydratedHero as any).heroJson ?? {};
              (hydratedHero as any).heroJson = {
                ...hj,
                equipmentEnchantLevels: { ...(hj.equipmentEnchantLevels ?? {}), ...le },
              };
            }
          }
        }
        const localSpVal = Number(localSnapshot.sp ?? (localSnapshot as any).heroJson?.sp ?? 0) || 0;
        const hydratedSpVal = Number((hydratedHero as any).sp ?? 0) || 0;
        const serverLearnedHere = skillsStrictlyAheadOnServer(
          localSnapshot.skills as any,
          (hydratedHero as any).skills as any
        );
        const mergedSpFromLocal =
          serverLearnedHere && hydratedSpVal < localSpVal
            ? hydratedSpVal
            : Math.max(localSpVal, hydratedSpVal);
        (hydratedHero as any).sp = mergedSpFromLocal;
        (hydratedHero as any).heroJson = { ...(hydratedHero as any).heroJson, sp: mergedSpFromLocal };
      }
    }
    
    // Логуємо фінальні дані для діагностики
    if (hydratedHero) {
      // 🔥 КРИТИЧНО: serverState має збігатися з тим героєм, якого показуємо після merge (hydratedHero),
      // інакше saveHeroToLocalStorage піднімає рівень назад через Math.max(local, serverState).
      const { useHeroStore } = await import('../heroStore');
      const char = character as any;
      const prog = readCharacterProgress(character);
      const heroSpAfterLoad = Number((hydratedHero as any).sp ?? 0) || 0;
      const hLvl = Number((hydratedHero as any).level);
      const hExp = Number((hydratedHero as any).exp);
      const syncLevel = Number.isFinite(hLvl) && hLvl >= 1 ? hLvl : prog.level;
      const syncExp = Number.isFinite(hExp) && hExp >= 0 ? hExp : prog.exp;
      useHeroStore.getState().updateServerState(
        {
          exp: syncExp,
          level: syncLevel,
          sp: Math.max(prog.sp, heroSpAfterLoad),
          adena: Number(char?.adena ?? hydratedHero.adena ?? 0),
          coinLuck: char?.coinLuck ?? hydratedHero.coinOfLuck ?? 0,
          heroRevision: (hydratedHero as any).heroRevision,
          updatedAt: Date.now(),
        },
        { revisionFromAuthoritativeGet: true }
      );
      
      console.log('[loadHeroFromAPI] Final hero after hydration:', {
        skillsCount: hydratedHero.skills?.length || 0,
        mobsKilled: (hydratedHero as any).mobsKilled,
        level: hydratedHero.level,
        exp: hydratedHero.exp,
        inventoryCount: hydratedHero.inventory?.length || 0,
        serverState: useHeroStore.getState().serverState,
      });
    }

    // ❗ ВАЖЛИВО: НЕ перезаписуємо heroJson, якщо він вже існує!
    // Якщо heroJson був порожній і ми створили нового героя - зберігаємо його в базу
    // Але ТІЛЬКИ якщо heroJson дійсно порожній (не має важливих полів)
    const wasEmpty = !heroData || typeof heroData !== 'object' || Object.keys(heroData).length === 0;
    if (wasEmpty && hydratedHero) {
      console.log('[loadHeroFromAPI] heroJson was empty, saving new hero to database');
      // Зберігаємо створеного героя в базу даних (асинхронно, не блокуємо)
      updateCharacter(character.id, {
        heroJson: (hydratedHero as any).heroJson,
      }).then(() => {
        console.log('[loadHeroFromAPI] Created hero saved to database');
      }).catch((error) => {
        console.error('[loadHeroFromAPI] Failed to save created hero to database:', error);
      });
    } else {
      console.log('[loadHeroFromAPI] heroJson exists, NOT overwriting with new hero');
    }

    const finalHero = hydratedHero || heroWithRecalculatedStats;
    if (finalHero) {
      const wid =
        (typeof characterStore.characterId === "string" && characterStore.characterId.trim().length > 0
          ? characterStore.characterId.trim()
          : String((finalHero as any)?.id ?? "").trim()) || undefined;
      const whSlots = (finalHero as any)?.heroJson?.warehouseSlots;
      // Той самий критерій, що й merge героя: новіший snapshot з API → склад не лишаємо «старим» лише в цьому браузері.
      if (preferServerSnapshot && wid) {
        applyWarehouseSlotsFromHeroJson(wid, whSlots, finalHero.name);
      } else {
        seedWarehouseFromHeroJsonIfStorageEmpty(wid, whSlots, finalHero.name);
      }
      if (preferServerSnapshot) {
        applyBattleLoadoutFromHeroJson(finalHero);
      } else {
        seedBattleLoadoutFromHeroJsonIfNeeded(finalHero);
      }
      const hn = finalHero.name;
      if (hn) {
        const savedBt = loadBattle(hn);
        if (professionOrLoadoutMismatchForBattle(hn, finalHero, savedBt)) {
          clearLoadout(hn);
          const slots = loadLoadout(hn);
          persistBattle(
            {
              ...savedBt,
              heroName: hn,
              heroBuffs: [],
              summon: undefined,
              summonBuffs: [],
              baseSummonStats: undefined,
              summonLastAttackAt: undefined,
              loadoutSlots: slots,
              professionForLoadout: finalHero.profession,
            },
            hn
          );
          const { useBattleStore } = await import("../battle/store");
          const st = useBattleStore.getState();
          if (st.heroName === hn || st.heroName == null || st.heroName === "") {
            useBattleStore.setState({
              heroBuffs: [],
              loadoutSlots: slots,
              professionForLoadout: finalHero.profession,
              summon: undefined,
              summonBuffs: [],
              baseSummonStats: undefined,
              summonLastAttackAt: undefined,
            });
          }
        }
      }
    }
    if (import.meta.env.DEV && finalHero) {
      const hj = (finalHero as any)?.heroJson || {};
      console.log("[LOAD SNAPSHOT]", {
        hp: finalHero.hp,
        mp: finalHero.mp,
        cp: finalHero.cp,
        maxHp: finalHero.maxHp,
        isDead: hj.isDead,
        deadAt: hj.deadAt,
        buffs: Array.isArray(hj.heroBuffs) ? hj.heroBuffs.length : 0,
        hpPercent: hj.hpPercent,
        mpPercent: hj.mpPercent,
        cpPercent: hj.cpPercent,
      });
    }
    return finalHero;
  } catch (error) {
    console.error('[loadHeroFromAPI] Failed to load hero from API:', error);
    console.warn('[loadHeroFromAPI] Returning null - will fallback to localStorage');
    // Повертаємо null, щоб App.tsx міг використати fallback на localStorage
    return null;
  }
}
