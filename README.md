# L2Dop (text-rpg)

Браузерна text-/клік-RPG у дусі **Lineage 2**: персонаж, бій, локації, клани, торгівля, PK тощо. Клієнт — **React + TypeScript + Vite**; сервер — **`server/`** (Fastify, Prisma, JWT + httpOnly refresh).

## Швидкий старт (розробка)

### Клієнт

```bash
npm install
npm run dev
```

За замовчуванням API: `http://localhost:3000`. Щоб вказати інший бекенд, створи `.env` у корені:

```env
VITE_API_URL=https://твій-api.example.com
```

### Сервер

```bash
cd server
npm install
# Налаштуй DATABASE_URL (і за потреби DIRECT_URL) у .env
npx prisma migrate dev
npm run dev
```

Продакшен-міграції БД:

```bash
cd server
npm run prisma:migrate:deploy
```

(За потреби з прямим підключенням: `npm run prisma:migrate:deploy:direct`.)

### Тести (клієнт)

```bash
npm test
```

## Завантаження героя (bootstrap)

1. Після логіну/реєстрації зберігаються `accessToken`, `current_character_id`, **`l2_current_user`** і запис героя у **`l2_accounts_v2`** (див. `heroPersistence.ts` та `HERO_SAVE_LOAD_DATAFLOW.md`).
2. **F5:** спочатку можливий герой з localStorage, у фоні — `GET /characters/:id` і merge за правилами у `heroLoadAPI` (деталі в `HERO_SAVE_LOAD_DATAFLOW.md`).
3. **Не дублюй** логіку HP/MP/CP, регену й бафів: джерело правди — `hero` у store → `heroPersistence` / `heroLoad` / `heroLoadAPI`; реген — `heroRegen.ts`; бафи на стати — `applyBuffsToStats`.

Корисні документи:

- [HERO_SAVE_LOAD_DATAFLOW.md](./HERO_SAVE_LOAD_DATAFLOW.md) — хто читає/пише hero та heroJson
- [REFERENCE_STATE.md](./REFERENCE_STATE.md) — опорний стан
- [CONTRIBUTING.md](./CONTRIBUTING.md)

## Стек

- UI: React 18, Zustand, Tailwind, React Router (кастомний роутер у `App.tsx`)
- Збірка: Vite 5, TypeScript 5
