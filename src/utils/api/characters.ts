import { apiRequest } from "./core";
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

/** Очистити інвентар на сервері (окремий ендпоінт — без exp/level, уникаємо "exp cannot be decreased") */
export async function clearInventoryAPI(characterId: string): Promise<Character> {
  const response = await apiRequest<CharacterResponse>(`/characters/${encodeURIComponent(characterId)}/inventory/clear`, {
    method: 'PUT',
    body: JSON.stringify({}),
  });
  return response.character;
}
/** Сплатити 1M аден для перегляду характеристик іншого гравця */
export async function payToViewPlayerStats(targetCharacterId: string): Promise<{ ok: boolean; newAdena: number }> {
  const response = await apiRequest<{ ok: boolean; newAdena: number }>(
    `/characters/${targetCharacterId}/pay-view-stats`,
    { method: "POST", body: JSON.stringify({}) }
  );
  return response;
}

/** Серверна оплата телепорту GK (рівень і адена з БД; до 40 lvl — безкоштовно). */
export async function postCharacterGkTeleport(
  characterId: string,
  body: { kind: "city" | "zone"; targetId: string }
): Promise<{ ok: boolean; charge: number; newAdena: number; currentCityId?: string }> {
  return apiRequest(`/characters/${characterId}/gk-teleport`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Resurrect: сервер атомарно скидає isDead/deadAt, ставить hp/mp/cp на max, heroBuffs=[]. Повертає оновленого character. */
export async function resurrectCharacter(id: string, ratio?: number): Promise<Character> {
  const body = ratio != null && ratio < 1 ? { ratio } : {};
  const response = await apiRequest<CharacterResponse>(`/characters/${id}/resurrect`, {
    method: 'POST',
    body: Object.keys(body).length ? JSON.stringify(body) : undefined,
  });
  return response.character;
}
// Player Admin API
export async function healPlayer(characterId: string, skillId: number, power: number): Promise<{ ok: boolean; healedHp?: number; currentHp?: number }> {
  const response = await apiRequest<{ ok: boolean; healedHp?: number; currentHp?: number }>(`/characters/${characterId}/heal`, {
    method: 'POST',
    body: JSON.stringify({ skillId, power }),
  });
  return response;
}

export async function buffPlayer(characterId: string, skillId: number, buffData: any): Promise<{ ok: boolean; message?: string }> {
  const response = await apiRequest<{ ok: boolean; message?: string }>(`/characters/${characterId}/buff`, {
    method: 'POST',
    body: JSON.stringify({ skillId, buffData }),
  });
  return response;
}

/** Здати книгу заклинання в гільдії магів (сервер знімає предмет і ставить heroJson.spellbookGuild). */
export async function postMageSpellbookTurnIn(
  characterId: string,
  body: { skillId: number }
): Promise<{ ok: boolean; character: Character; guildKey?: string }> {
  return apiRequest(`/characters/${encodeURIComponent(characterId)}/mage-spellbook/turn-in`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Серверне вивчення скілу гільдії за SP (whitelist професії + книга для містика). */
export async function postLearnSkill(
  characterId: string,
  body: { skillId: number }
): Promise<{ ok: boolean; character: Character }> {
  return apiRequest(`/characters/${encodeURIComponent(characterId)}/learn-skill`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Додатковий скіл за адену — сума та whitelist лише на сервері. */
export async function postLearnAdditionalSkill(
  characterId: string,
  body: { skillId: number }
): Promise<{ ok: boolean; character: Character }> {
  const skillId = Math.trunc(Number(body.skillId));
  if (!Number.isFinite(skillId) || skillId <= 0 || !Number.isInteger(skillId)) {
    return Promise.reject(new Error("invalid skill id"));
  }
  return apiRequest(`/characters/${encodeURIComponent(characterId)}/learn-additional-skill`, {
    method: "POST",
    body: JSON.stringify({ skillId }),
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

