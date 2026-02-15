# Hero Persistence & Revision Flow — повний розбір

## 1. src/state/heroStore/heroPersistence.ts

### Глобальні змінні (inFlight, debounce, queue, pendingSave)

```ts
let saving = false;      // mutex — один save за раз
let queued = false;      // є зміни, що чекають після завершення поточного save
let retryCount = 0;      // лічильник retry при 409
const MAX_RETRIES = 1;   // максимум 1 retry при revision_conflict
```

**Немає:** `inFlight` (Promise), `lastSavedRevision`, `pendingSave` (в heroPersistence).
**Є в heroStore:** `pendingSave`, `saveTimeout`, `criticalSaveQueue`, `criticalSaveTimeout`.

---

### saveHeroOnce (від початку до return)

**Логіка:**
1. `hydrateHero(hero)` → використовуємо hydrated hero.
2. Якщо не auth / немає characterId → пишемо тільки в localStorage, `return`.
3. Rate limit cooldown → пишемо тільки в localStorage, `return`.
4. `expectedRevision = serverState?.heroRevision ?? hero.heroRevision ?? hero.heroJson?.heroRevision`
5. Формуємо `heroJsonToSave` (merge existingHeroJson + hero fields: skills, exp, level, hp/mp/cp, inventory, equipment, etc.)
6. Clamp exp/sp з serverState.
7. `updatePayload = { heroJson, level, exp, sp, adena, aa, expectedRevision }`, опційно `coinLuck`.
8. `updatedCharacter = await updateCharacter(characterId, updatePayload)`.
9. При успіху: `applyServerSync({ heroRevision, exp, sp, level }, { exp, level, sp, coinLuck, heroRevision })` + пишемо в localStorage як backup.
10. При 409: reload (getCharacter), merge local+server, `applyServerSync`, `saveHeroOnce(heroToSave)` — retry.
11. При 429: setRateLimitCooldown, backup в localStorage, `return`.
12. Інші помилки: fallback в localStorage.

---

### Де формується updatePayload (рядки 384–392)

```ts
const updatePayload: Parameters<typeof updateCharacter>[1] = {
  heroJson: heroJsonToSave,
  level: levelToSend,
  exp: expToSend,
  sp: spToSend,
  adena: hero.adena,
  aa: hero.aa || 0,
  expectedRevision,
};
if (sendCoinLuck) (updatePayload as any).coinLuck = localCoinLuck;
```

---

### Де викликається updateCharacter (рядок 395)

```ts
const updatedCharacter = await updateCharacter(characterStore.characterId, updatePayload);
```

---

### Що робимо з response від updateCharacter

**При успіху (рядки 401–434):**
- `newRevision = updatedCharacter.heroRevision || updatedCharacter.revision`
- `applyServerSync({ heroRevision: newRevision, exp, sp, level }, { exp, level, sp, coinLuck, heroRevision: newRevision })` — оновлює hero + serverState у store, **не** викликає persistence.
- Запис у localStorage як backup (hero з поточним heroJson, без newRevision у hero — applyServerSync оновлює store, але localStorage пишемо з локального hero; hero в store вже має newRevision через applyServerSync).

**При 409:**
- getCharacter → merge skills/exp/mobsKilled/buffs з `localSource` (currentHero ?? hero)
- `applyServerSync(mergedHero, { exp, level, sp, heroRevision: newRevision })`
- `saveHeroOnce(heroToSave)` — retry з уже оновленим hero у store.

---

### saveHeroToLocalStorage (вхід до saveHeroOnce)

- Якщо `saving === true` → `queued = true`, `return`.
- `saving = true` → `saveHeroOnce(hero)` → у `finally` `saving = false`.
- Якщо `queued` → `setTimeout(100ms)` → `saveHeroToLocalStorage(currentHero)` (hero з store).

---

## 2. src/state/heroStore.ts

### learnSkill (рядки 386–398)

```ts
learnSkill: (skillId: number) => {
  const hero = get().hero;
  if (!hero) return false;
  const result = learnSkillLogic(hero, skillId);
  if (result.success && result.updatedHero) {
    get().updateHero({
      skills: result.updatedHero.skills,
      sp: result.updatedHero.sp,
    });
  }
  return result.success;
},
```

Не чіпає `heroRevision` / `heroJson.heroRevision` — тільки `skills` та `sp`.

---

### updateHero (рядки 293–345)

- `updated = updateHeroLogic(prev, partial)` — merge partial у prev.
- `updateHeroLogic` **не** встановлює `heroRevision` — лише merge partial (в т.ч. partial.heroJson).
- Якщо `partial.heroJson` містить `heroRevision` — він потрапляє в updated через spread.
- `set({ hero: updated })`.
- `saveHeroToLocalStorageOnly(updated)` — завжди.
- Якщо `onlyRegen` (hp/mp/cp/status) → `return` (без API save).
- `isCriticalChange` = skills, sp, profession, inventory, equipment, adena, coinLuck, aa, level, exp, heroJson.heroBuffs.
- Якщо critical → `immediateSave(updated)`; інакше → `debouncedSave(updated)`.

---

### immediateSave (рядки 147–193)

- Rate limit cooldown → `criticalSaveQueue = hero`, `scheduleCriticalSaveAfterCooldown()`, `saveHeroToLocalStorageOnly(hero)`, `return`.
- Очищає `saveTimeout`, `pendingSave`, `criticalSaveQueue`, `criticalSaveTimeout`.
- `saveHeroToLocalStorageOnly(hero)`.
- `saveHeroToLocalStorage(hero).catch(...)` — при 429 ставить cooldown і `criticalSaveQueue`.

---

### debouncedSave (рядки 115–145)

- `pendingSave = hero`.
- `setTimeout(SAVE_DEBOUNCE_MS)` → `saveHeroToLocalStorage(pendingSave)`.

---

### applyServerSync (рядки 347–365)

- `merged = { ...prev, ...partial }` (hydrateHero).
- `set({ hero: merged })`.
- `set({ serverState: { exp, level, sp, coinLuck, heroRevision, updatedAt } })`.
- `saveHeroToLocalStorageOnly(merged)` — **не** викликає API save.

---

## 3. src/utils/api.ts — updateCharacter

```ts
export async function updateCharacter(id: string, data: UpdateCharacterRequest): Promise<Character> {
  const response = await apiRequest<CharacterResponse>(`/characters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.character;
}
```

**Повертає:** `response.character` — об’єкт `Character` (id, name, race, classId, sex, level, exp, sp, adena, aa, coinLuck, heroJson, updatedAt, …).

**heroRevision:** береться з `character.heroJson?.heroRevision` (heroJson приходить з сервера). У типі `Character` немає окремого `heroRevision` — він всередині `heroJson`.

**toJsonSafe:** на клієнті не використовується. Використовується на сервері в `preSerialization` hook — BigInt і подібне приводяться до JSON-safe значень.

---

## 4. Бекенд: PUT /api/characters/:id — response при успіху

**Файл:** server/src/characters.ts

**Після успішного update (рядки 1042–1048):**

```ts
// Convert BigInt to Number for JSON serialization
const serialized = {
  ...updated,
  exp: Number(updated.exp),
};
return { ok: true, character: serialized };
```

**updated** — результат `prisma.character.update` або результат транзакції з `select`:

- id, name, race, classId, sex, level, exp, sp, adena, aa, coinLuck, heroJson, updatedAt

**heroRevision** знаходиться в `character.heroJson.heroRevision` (всередині JSONB heroJson). Окремих полів `serverState` або `heroRevision` на верхньому рівні response немає — Prisma повертає `character` з полем `heroJson`, всередині нього `heroRevision`.

Клієнт у heroPersistence: `newRevision = (updatedCharacter as any).heroRevision || (updatedCharacter as any).revision || (updatedCharacter.heroJson as any)?.heroRevision` — fallback на heroJson.heroRevision, бо сервер повертає heroRevision всередині heroJson, а не на верхньому рівні.

---

## 5. Підсумок потоків

| Компонент | inFlight / mutex | debounce | queue | pendingSave | lastSavedRevision |
|-----------|------------------|----------|-------|-------------|-------------------|
| heroPersistence | `saving` (bool) | — | `queued` (bool) | — | — |
| heroStore | — | `saveTimeout` (5s) | `criticalSaveQueue` | `pendingSave` | `serverState.heroRevision` |

**heroRevision джерела:**
- Сервер: `heroJson.heroRevision` (після addVersioning = Date.now() або old+1).
- Клієнт: `serverState?.heroRevision ?? hero.heroRevision ?? hero.heroJson?.heroRevision`.
