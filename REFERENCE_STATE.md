# Опорний стан проєкту (Reference State)

**Призначення:** Зафіксований стан, до якого можна повернутися, якщо щось піде не так. Не змінювати логіку джерел правди — лише одне джерело, як зараз.

---

## Як повернутися до цього стану

```bash
git fetch --tags
git checkout ref-hp-buffs-single-source
```

Або за комітом:

```bash
git checkout 986c1f0b1155b61cbf56ce246e7a7f313575d6db
```

---

## Що зафіксовано в цьому стані

- **HP/MP/CP** — не падають після F5; одне джерело правди: `hero` у store, збереження через `heroPersistence` / `heroLoad` / `heroLoadAPI`.
- **Смерть у бою** — герой справді вмирає (hp=0, isDead); після оновлення сторінки — відновлення до 70% max HP (оживлення при reload).
- **Реген** — один модуль `heroRegen.ts` (`getHeroRegenPerSecond`); значення як у статах (battleStats + бафи, fallback за рівнем).
- **Бафи** — зберігаються в `heroJson.heroBuffs` та battle persist; при load мердж з loadBattle; без дублювання джерел.
- **Скіли / пасивні / сети** — працюють через поточну логіку (recalculateAllStats, applyBuffsToStats, hero.battleStats); не додавати другі джерела обчислення.

---

## Правило: одне джерело правди

- Джерело правди для стану героя (hp, mp, cp, maxHp, бафи, isDead тощо) — **те, що є зараз**: store (`hero`), збереження через `heroPersistence`, завантаження через `heroLoad` / `heroLoadAPI`, реген через `heroRegen.ts`.
- **Не винаходити інших джерел:** не дублювати логіку HP/регену/бафів у нових місцях; не вводити паралельні схеми збереження або обчислення статів.
- При змінах відштовхуватися від цього стану і від документу `HERO_SAVE_LOAD_DATAFLOW.md`.

---

**Тег:** `ref-hp-buffs-single-source`  
**Коміт:** `986c1f0b` (fix: death stays; on reload restore 70pct HP; regen from stats only)
