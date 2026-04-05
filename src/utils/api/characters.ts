import { apiRequest } from "./core";
import { applyRevisionConflictFromApiError } from "../../state/heroStore";
import type {
  Character,
  CreateCharacterRequest,
  UpdateCharacterRequest,
  CharactersResponse,
  CharacterResponse,
} from "./typesAuthCharacter";

// Character API functions
export async function listCharacters(): Promise<Character[]> {
  const response = await apiRequest<CharactersResponse>('/characters', {
    method: 'GET',
  });
  return response.characters;
}

export async function getCharacter(id: string): Promise<Character> {
  if (import.meta.env.DEV) {
    console.log('GET character called', new Error().stack);
  }
  const response = await apiRequest<CharacterResponse>(`/characters/${id}`, {
    method: 'GET',
  });
  return response.character;
}

export async function getPublicCharacter(id: string): Promise<Character> {
  const response = await apiRequest<CharacterResponse>(`/characters/public/${id}`, {
    method: 'GET',
  });
  const char = response?.character;
  if (!char?.id) throw new Error("Персонаж не знайдено");
  return char;
}

export async function getCharacterByName(name: string): Promise<Character> {
  const response = await apiRequest<CharacterResponse>(`/characters/by-name/${encodeURIComponent(name)}`, {
    method: 'GET',
  });
  return response.character;
}

export async function createCharacter(data: CreateCharacterRequest): Promise<Character> {
  const response = await apiRequest<CharacterResponse>('/characters', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.character;
}

/** top-level exp/level не шлемо — колонки в БД можуть лишатися старими; прогрес у heroJson. SP шлемо — інакше Character.sp не оновлюється після мобів і після F5 відкат. */
export async function updateCharacter(id: string, data: UpdateCharacterRequest): Promise<Character> {
  const cleanData = { ...data };
  delete cleanData.exp;
  delete cleanData.level;

  const response = await apiRequest<CharacterResponse>(`/characters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(cleanData),
  });
  return response.character;
}

/** Оновити тільки inventory/overflowChest з optimistic revision-lock. */
export async function updateInventoryAPI(
  characterId: string,
  data: { inventory?: any[]; overflowChest?: any[]; expectedRevision: number }
): Promise<Character> {
  const response = await apiRequest<CharacterResponse>(`/characters/${encodeURIComponent(characterId)}/inventory`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.character;
}

/** Server-authoritative NPC sell (atomic inventory decrease + adena increase). */
export async function sellInventoryItemsAPI(
  characterId: string,
  data: {
    expectedRevision: number;
    operations: Array<{
      inventoryIndex: number;
      amount: number;
      expectedItemId: string;
      expectedEnchantLevel?: number;
    }>;
  }
): Promise<{ ok: boolean; payoutAdena: number; character: Character }> {
  return apiRequest<{ ok: boolean; payoutAdena: number; character: Character }>(
    `/characters/${encodeURIComponent(characterId)}/sell`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

/** Видалити предмет з інвентаря на сервері (atomic + CAS revision). */
export async function deleteInventoryItemAPI(
  characterId: string,
  data: {
    expectedRevision: number;
    inventoryIndex: number;
    amount?: number;
    expectedItemId: string;
    expectedEnchantLevel?: number;
  }
): Promise<{ ok: boolean; character: Character }> {
  return apiRequest<{ ok: boolean; character: Character }>(
    `/characters/${encodeURIComponent(characterId)}/inventory/delete`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

/** Очистити інвентар на сервері (окремий ендпоінт — без exp/level, уникаємо "exp cannot be decreased") */
export async function clearInventoryAPI(characterId: string, expectedRevision: number): Promise<Character> {
  const response = await apiRequest<CharacterResponse>(`/characters/${encodeURIComponent(characterId)}/inventory/clear`, {
    method: 'PUT',
    body: JSON.stringify({ expectedRevision }),
  });
  return response.character;
}

export async function postWarehouseDeposit(
  characterId: string,
  body: {
    expectedRevision: number;
    inventoryIndex: number;
    count: number;
    targetSlotIndex?: number;
  }
): Promise<Character> {
  const response = await apiRequest<CharacterResponse>(
    `/characters/${encodeURIComponent(characterId)}/warehouse/deposit`,
    { method: "POST", body: JSON.stringify(body) }
  );
  return response.character;
}

export async function postWarehouseWithdraw(
  characterId: string,
  body: {
    expectedRevision: number;
    slotIndex: number;
    count?: number;
  }
): Promise<Character> {
  const response = await apiRequest<CharacterResponse>(
    `/characters/${encodeURIComponent(characterId)}/warehouse/withdraw`,
    { method: "POST", body: JSON.stringify(body) }
  );
  return response.character;
}

export async function postResourceCraft(
  characterId: string,
  body: {
    expectedRevision: number;
    tier: number;
    recipeIndex: number;
    quantity: number;
  }
): Promise<Character> {
  const response = await apiRequest<CharacterResponse>(
    `/characters/${encodeURIComponent(characterId)}/resource-craft`,
    { method: "POST", body: JSON.stringify(body) }
  );
  return response.character;
}

export async function postTattooApply(
  characterId: string,
  body: { expectedRevision: number; dyeItemId: string }
): Promise<Character> {
  const response = await apiRequest<CharacterResponse>(
    `/characters/${encodeURIComponent(characterId)}/tattoo/apply`,
    { method: "POST", body: JSON.stringify(body) }
  );
  return response.character;
}

export async function postTattooRemove(
  characterId: string,
  body: { expectedRevision: number; index: number }
): Promise<Character> {
  const response = await apiRequest<CharacterResponse>(
    `/characters/${encodeURIComponent(characterId)}/tattoo/remove`,
    { method: "POST", body: JSON.stringify(body) }
  );
  return response.character;
}
/** Сплатити 1M аден для перегляду характеристик іншого гравця */
export async function payToViewPlayerStats(
  targetCharacterId: string,
  expectedRevision: number
): Promise<{ ok: boolean; newAdena: number; character?: Character }> {
  const response = await apiRequest<{ ok: boolean; newAdena: number; character?: Character }>(
    `/characters/${targetCharacterId}/pay-view-stats`,
    { method: "POST", body: JSON.stringify({ expectedRevision }) }
  );
  return response;
}

/** Серверна оплата телепорту GK (рівень і адена з БД; до 40 lvl — безкоштовно). */
export async function postCharacterGkTeleport(
  characterId: string,
  body: { kind: "city" | "zone"; targetId: string; expectedRevision: number }
): Promise<{ ok: boolean; charge: number; newAdena: number; currentCityId?: string; character?: Character }> {
  return apiRequest(`/characters/${characterId}/gk-teleport`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Resurrect: сервер атомарно скидає isDead/deadAt, ставить hp/mp/cp на max, heroBuffs=[]. Повертає оновленого character. */
export async function resurrectCharacter(
  id: string,
  ratio?: number,
  expectedRevision?: number
): Promise<Character> {
  const body: Record<string, unknown> = {};
  if (ratio != null && ratio < 1) body.ratio = ratio;
  if (Number.isFinite(Number(expectedRevision)) && Number(expectedRevision) >= 0) {
    body.expectedRevision = Number(expectedRevision);
  }
  const response = await apiRequest<CharacterResponse>(`/characters/${id}/resurrect`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return response.character;
}

function parseHeroJsonFromCharacter(raw: unknown): Record<string, any> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, any>;
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      if (p && typeof p === "object" && !Array.isArray(p)) return p as Record<string, any>;
    } catch {
      /* ignore */
    }
  }
  return {};
}

async function readHeroRevisionFromGetCharacter(characterId: string): Promise<number> {
  const char = await getCharacter(characterId);
  const hj = parseHeroJsonFromCharacter((char as any)?.heroJson);
  const r = Number(hj.heroRevision ?? 0);
  return Number.isFinite(r) && r >= 0 ? r : 0;
}

async function syncHeroBuffsAttempt(
  characterId: string,
  heroBuffs: any[],
  expectedRevision: number
): Promise<{ ok: boolean; character: Character; priorRevisionUsed: number }> {
  try {
    const res = await apiRequest<{ ok: boolean; character: Character }>(
      `/characters/${encodeURIComponent(characterId)}/hero-buffs-sync`,
      {
        method: "POST",
        body: JSON.stringify({ heroBuffs, expectedRevision }),
      }
    );
    return { ...res, priorRevisionUsed: expectedRevision };
  } catch (e: any) {
    if (e?.status !== 404) throw e;
    const character = await updateCharacter(characterId, {
      syncHeroBuffs: heroBuffs,
      expectedRevision,
    });
    return { ok: true, character, priorRevisionUsed: expectedRevision };
  }
}

/**
 * Зберегти heroBuffs на сервері (CAS). Перед відправкою тягнемо свіжу revision з GET — інакше застарілий serverState дає 409 і все мовчки падає.
 * POST .../hero-buffs-sync; при 404 — PUT з syncHeroBuffs.
 */
export async function syncHeroBuffsAPI(
  characterId: string,
  data: { heroBuffs: any[]; expectedRevision: number }
): Promise<{ ok: boolean; character: Character; priorRevisionUsed: number }> {
  let rev = data.expectedRevision;
  try {
    rev = await readHeroRevisionFromGetCharacter(characterId);
  } catch {
    rev = data.expectedRevision;
  }

  try {
    return await syncHeroBuffsAttempt(characterId, data.heroBuffs, rev);
  } catch (e: any) {
    if (e?.status !== 409) throw e;
    applyRevisionConflictFromApiError(e);
    const fromBody = Number(
      (e as any)?.body?.currentRevision ?? (e as any)?.body?.serverState?.heroRevision
    );
    let rev2: number;
    try {
      rev2 = await readHeroRevisionFromGetCharacter(characterId);
    } catch {
      if (Number.isFinite(fromBody) && fromBody >= 0) rev2 = fromBody;
      else throw e;
    }
    return await syncHeroBuffsAttempt(characterId, data.heroBuffs, rev2);
  }
}

/** PvE buff/toggle — повний character snapshot після мутації (CAS). */
/** PvE старт бою — battleSession у heroJson (CAS). */
export async function battleStartAPI(
  characterId: string,
  data: {
    expectedRevision: number;
    zoneId: string;
    mobIndex: number;
    mobId: string;
    clientMobMaxHp: number;
    mobIsRaidBoss?: boolean;
    /** Профіль рейд-AI з моба; сервер валідує whitelist. */
    raidAiProfileId?: string;
    mobIsEpicRaidBoss?: boolean;
  }
): Promise<Character & { sessionMobHp?: number; sessionMobMaxHp?: number }> {
  let rev = data.expectedRevision;
  try {
    rev = await readHeroRevisionFromGetCharacter(characterId);
  } catch {
    rev = data.expectedRevision;
  }
  const url = `/characters/${encodeURIComponent(characterId)}/pve-battle-start`;
  const body = { ...data, expectedRevision: rev };
  try {
    const res = await apiRequest<{
      ok: boolean;
      character: Character;
      sessionMobHp?: number;
      sessionMobMaxHp?: number;
    }>(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res?.character) throw new Error("no character");
    return Object.assign(res.character, {
      sessionMobHp: res.sessionMobHp,
      sessionMobMaxHp: res.sessionMobMaxHp,
    });
  } catch (e: any) {
    if (e?.status !== 409) throw e;
    applyRevisionConflictFromApiError(e);
    const fromBody = Number(
      (e as any)?.body?.currentRevision ?? (e as any)?.body?.serverState?.heroRevision
    );
    let rev2: number;
    try {
      rev2 = await readHeroRevisionFromGetCharacter(characterId);
    } catch {
      if (Number.isFinite(fromBody) && fromBody >= 0) rev2 = fromBody;
      else throw e;
    }
    const res = await apiRequest<{
      ok: boolean;
      character: Character;
      sessionMobHp?: number;
      sessionMobMaxHp?: number;
    }>(url, {
      method: "POST",
      body: JSON.stringify({ ...data, expectedRevision: rev2 }),
    });
    if (!res?.character) throw new Error("no character");
    return Object.assign(res.character, {
      sessionMobHp: res.sessionMobHp,
      sessionMobMaxHp: res.sessionMobMaxHp,
    });
  }
}

/** PvE атакуючий скил — урон і MP на сервері (CAS). */
export async function pveBattleAttackAPI(
  characterId: string,
  data: {
    skillId: number;
    expectedRevision: number;
    heroCombatStats: Record<string, number>;
    skillName?: string;
    loadoutSlots?: (number | string | null)[];
    activeChargeSlots?: number[];
    mobBuffs?: any[];
  }
): Promise<{
  ok: boolean;
  character: Character;
  logLines?: string[];
  damage?: number;
  isCrit?: boolean;
  mobHpAfter?: number;
  killed?: boolean;
}> {
  let rev = data.expectedRevision;
  try {
    rev = await readHeroRevisionFromGetCharacter(characterId);
  } catch {
    rev = data.expectedRevision;
  }
  const url = `/characters/${encodeURIComponent(characterId)}/pve-battle-attack`;
  const payload = { ...data, expectedRevision: rev };
  try {
    return await apiRequest(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (e: any) {
    if (e?.status !== 409) throw e;
    applyRevisionConflictFromApiError(e);
    const fromBody = Number(
      (e as any)?.body?.currentRevision ?? (e as any)?.body?.serverState?.heroRevision
    );
    let rev2: number;
    try {
      rev2 = await readHeroRevisionFromGetCharacter(characterId);
    } catch {
      if (Number.isFinite(fromBody) && fromBody >= 0) rev2 = fromBody;
      else throw e;
    }
    return await apiRequest(url, {
      method: "POST",
      body: JSON.stringify({ ...data, expectedRevision: rev2 }),
    });
  }
}

/** PvE тік моба — урон по герою на сервері (CAS). */
export async function pveBattleTickAPI(
  characterId: string,
  data: {
    expectedRevision: number;
    heroDefenseStats: Record<string, number>;
  }
): Promise<{
  ok: boolean;
  character: Character;
  logLines?: string[];
  heroHpAfter?: number;
  killedHero?: boolean;
  battleControl?: {
    heroStunnedUntil?: number;
    heroBuffsBlockedUntil?: number;
    heroSkillsBlockedUntil?: number;
  };
}> {
  let rev = data.expectedRevision;
  try {
    rev = await readHeroRevisionFromGetCharacter(characterId);
  } catch {
    rev = data.expectedRevision;
  }
  const url = `/characters/${encodeURIComponent(characterId)}/pve-battle-tick`;
  const payload = { ...data, expectedRevision: rev };
  try {
    return await apiRequest(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (e: any) {
    if (e?.status !== 409) throw e;
    applyRevisionConflictFromApiError(e);
    const fromBody = Number(
      (e as any)?.body?.currentRevision ?? (e as any)?.body?.serverState?.heroRevision
    );
    let rev2: number;
    try {
      rev2 = await readHeroRevisionFromGetCharacter(characterId);
    } catch {
      if (Number.isFinite(fromBody) && fromBody >= 0) rev2 = fromBody;
      else throw e;
    }
    return await apiRequest(url, {
      method: "POST",
      body: JSON.stringify({ ...data, expectedRevision: rev2 }),
    });
  }
}

export async function pveCastSelfBuffAPI(
  characterId: string,
  data: { skillId: number; expectedRevision: number }
): Promise<{ ok: boolean; character: Character; logLine?: string }> {
  let rev = data.expectedRevision;
  try {
    rev = await readHeroRevisionFromGetCharacter(characterId);
  } catch {
    rev = data.expectedRevision;
  }
  const url = `/characters/${encodeURIComponent(characterId)}/pve-self-buff`;
  const body = { skillId: data.skillId, expectedRevision: rev };
  try {
    return await apiRequest<{ ok: boolean; character: Character; logLine?: string }>(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    if (e?.status !== 409) throw e;
    applyRevisionConflictFromApiError(e);
    const fromBody = Number(
      (e as any)?.body?.currentRevision ?? (e as any)?.body?.serverState?.heroRevision
    );
    let rev2: number;
    try {
      rev2 = await readHeroRevisionFromGetCharacter(characterId);
    } catch {
      if (Number.isFinite(fromBody) && fromBody >= 0) rev2 = fromBody;
      else throw e;
    }
    return await apiRequest<{ ok: boolean; character: Character; logLine?: string }>(url, {
      method: "POST",
      body: JSON.stringify({ skillId: data.skillId, expectedRevision: rev2 }),
    });
  }
}

// Player Admin API
export async function healPlayer(
  characterId: string,
  skillId: number,
  power: number,
  expectedRevision: number
): Promise<{ ok: boolean; healedHp?: number; currentHp?: number }> {
  const response = await apiRequest<{ ok: boolean; healedHp?: number; currentHp?: number }>(`/characters/${characterId}/heal`, {
    method: 'POST',
    body: JSON.stringify({ skillId, power, expectedRevision }),
  });
  return response;
}

export async function buffPlayer(
  characterId: string,
  skillId: number,
  buffData: any,
  expectedRevision: number
): Promise<{ ok: boolean; message?: string }> {
  const response = await apiRequest<{ ok: boolean; message?: string }>(`/characters/${characterId}/buff`, {
    method: 'POST',
    body: JSON.stringify({ skillId, buffData, expectedRevision }),
  });
  return response;
}

/** Здати книгу заклинання в гільдії магів (сервер знімає предмет і ставить heroJson.spellbookGuild). */
export async function postMageSpellbookTurnIn(
  characterId: string,
  body: { skillId: number; expectedRevision: number }
): Promise<{ ok: boolean; character: Character; guildKey?: string }> {
  return apiRequest(`/characters/${encodeURIComponent(characterId)}/mage-spellbook/turn-in`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Серверне вивчення скілу гільдії за SP (whitelist професії + книга для містика). */
export async function postLearnSkill(
  characterId: string,
  body: { skillId: number; expectedRevision: number }
): Promise<{ ok: boolean; character: Character }> {
  return apiRequest(`/characters/${encodeURIComponent(characterId)}/learn-skill`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Додатковий скіл за адену — сума та whitelist лише на сервері. */
export async function postLearnAdditionalSkill(
  characterId: string,
  body: { skillId: number; expectedRevision: number }
): Promise<{ ok: boolean; character: Character }> {
  const skillId = Math.trunc(Number(body.skillId));
  const expectedRevision = Math.trunc(Number(body.expectedRevision));
  if (!Number.isFinite(skillId) || skillId <= 0 || !Number.isInteger(skillId)) {
    return Promise.reject(new Error("invalid skill id"));
  }
  if (!Number.isFinite(expectedRevision) || expectedRevision < 0 || !Number.isInteger(expectedRevision)) {
    return Promise.reject(new Error("expectedRevision required"));
  }
  return apiRequest(`/characters/${encodeURIComponent(characterId)}/learn-additional-skill`, {
    method: "POST",
    body: JSON.stringify({ skillId, expectedRevision }),
  });
}

/** Обмін срібних монет квест-шопу на adena / exp / sp / coin of luck — валідація балансу на сервері. */
export async function postQuestShopExchange(
  characterId: string,
  body: { kind: "adena" | "exp" | "sp" | "coinOfLuck"; quantity: number; expectedRevision: number }
): Promise<{ ok: boolean; character: Character }> {
  return apiRequest(`/characters/${encodeURIComponent(characterId)}/quest-shop/exchange`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Здача квесту в місті (сервер: інвентар, валюта, журнал). */
export async function postQuestCompleteAPI(
  characterId: string,
  body: { questId: string; expectedRevision: number }
): Promise<{
  ok: boolean;
  character: Character;
  needsRewardPick?: boolean;
  pickAllowedItemIds?: string[];
}> {
  return apiRequest(`/characters/${encodeURIComponent(characterId)}/quests/complete`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Вибір нагороди після здачі (тіньова зброя тощо). */
export async function postQuestPickRewardAPI(
  characterId: string,
  body: { questId: string; itemId: string; expectedRevision: number }
): Promise<{ ok: boolean; character: Character }> {
  return apiRequest(`/characters/${encodeURIComponent(characterId)}/quests/pick-reward`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

