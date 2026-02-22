# Деплой API (api.l2dop.com)

Щоб не було **404 на /api/premium/buy** і **401 після простою**, сервер має бути задеплоєний з актуальним кодом і правильними env.

## 0. Пуш з локальної машини + деплой на VPS

**Автоматичного деплою немає.** Код на VPS не оновлюється сам після `git push`. Коли хочеш викласти зміни на сервер — **вручну** запускай один із скриптів нижче (з комп'ютера, після `git add` + `git commit`). Скрипт пушить у репо, потім по SSH заходить на VPS і робить там `git pull`, збірку і перезапуск PM2.

**PowerShell (Windows):**
```powershell
$env:VPS_HOST = "api.l2dop.com"   # або IP
$env:VPS_USER = "root"            # опційно, за замовчуванням root
.\scripts\push-and-deploy-vps.ps1
```

**Bash (WSL / Linux / Mac):**
```bash
VPS_HOST=api.l2dop.com ./scripts/push-and-deploy-vps.sh
# з іншим юзером: VPS_HOST=1.2.3.4 VPS_USER=deploy ./scripts/push-and-deploy-vps.sh
```

Скрипт робить: `git push` → SSH на VPS → `git pull`, `npm ci`, Prisma, `npm run build`, `pm2 restart text-rpg-api`.

## 1. Актуальний код

У репозиторії є маршрути:
- `POST /premium/buy` — покупка преміуму (файл `src/routes/premium.ts`)
- `POST /auth/refresh` — оновлення access token по refresh cookie
- `POST /characters/:id/colorize-nick`, `POST /characters/:id/rename-nick`, `POST /characters/:targetId/pay-view-stats` — в `src/characters.ts`

Після змін у сервері обов’язково **перезбирай і перезапускай** API на хостингу (Railway, VPS тощо).

## 2. Env для кукі (щоб не було 401 після простою)

Якщо фронт відкривають на **www.l2dop.com**, а запити йдуть на **www.l2dop.com/api/...** (Vercel проксує на api.l2dop.com), refresh-токен зберігається в кукі. Щоб кукі ділилося між піддоменами і відправлялося при запитах з www:

На сервері (api.l2dop.com) у `.env` додай:

```env
COOKIE_SECURE=true
COOKIE_DOMAIN=.l2dop.com
COOKIE_SAME_SITE=none
REFRESH_COOKIE_PATH=/
REFRESH_TTL_DAYS=30
```

- `COOKIE_DOMAIN=.l2dop.com` — кукі буде відправлятися і на www.l2dop.com, і на api.l2dop.com.
- `COOKIE_SAME_SITE=none` і `COOKIE_SECURE=true` — потрібні для cross-site cookie (різні піддомени).

Після зміни env **перезапусти** API.

## 3. Vercel (фронт)

У `vercel.json` уже є rewrites:
- `/api/premium/buy` → `https://api.l2dop.com/premium/buy`
- `/api/:path*` → `https://api.l2dop.com/:path*`

Якщо все одно 404 — переконайся, що на api.l2dop.com крутиться саме цей репо з маршрутом `POST /premium/buy`.

## 4. Міграція BigInt для валюти

Після оновлення коду **обов'язково** застосуй міграцію (якщо ще не зроблено):

```bash
cd server && npx prisma migrate deploy
```

Міграція `20260217130000_currency_to_bigint` переводить `adena`, `aa`, `coinLuck`, `coinsSilver` з 32-bit INTEGER на 64-bit BIGINT — інакше при сумі Adena > 2.1 млрд буде помилка "integer out of range" при продажу предметів.

## 5. 7 Печатей — розсилка листів

Щосуботи о 00:00 за ігровим часом (Europe/Warsaw) топ-3 переможці отримують лист у пошті від персонажа **Existence**. Потрібно, щоб у БД існував персонаж з іменем "Existence". Час визначається через `Intl.DateTimeFormat` (Europe/Warsaw). Якщо розсилка не спрацювала — вручну: `POST /admin/seven-seals/send-mail` (Bearer адмін-токен). Якщо вже відправлено цього тижня — Kv `seven_seals_mail_last_week` блокує повтор; для повторного тесту видаліть цей запис з Kv.
