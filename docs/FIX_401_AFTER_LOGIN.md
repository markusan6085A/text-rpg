# Виправлення 401 після входу (сесія "вмирає" через кілька секунд)

## Проблема
Після входу через 5–10 секунд з'являється 401 Unauthorized на `/api/auth/refresh` та інших ендпоінтах. Користувач виходить з гри.

**Клієнт:** Перевірку адміна (`admin/auth/me`) тепер викликаємо тільки на сторінках /admin, /city, /player/*, /chat — це зменшує 401 для гравців на /battle, /inventory тощо.

## Причина
Refresh cookie (`refresh_token`) не відправляється браузером на сервер. Це зазвичай через:
1. **Неправильний Domain** — cookie встановлено для `api.l2dop.com`, а запити йдуть через `www.l2dop.com/api/...`
2. **SameSite** — при cross-origin потрібно `SameSite=None`

## Рішення: змінні середовища на API-сервері (api.l2dop.com)

Додай у `.env` на сервері:

```env
# Cookie для refresh token — ОБОВ'ЯЗКОВО для l2dop.com
COOKIE_DOMAIN=.l2dop.com
COOKIE_SAME_SITE=none
COOKIE_SECURE=true
REFRESH_COOKIE_PATH=/
```

**Важливо:**
- `COOKIE_DOMAIN=.l2dop.com` — крапка на початку, щоб cookie ділилося між www та api
- `COOKIE_SAME_SITE=none` + `COOKIE_SECURE=true` — потрібно разом (браузер вимагає Secure для SameSite=None)
- Після зміни — **перезапусти сервер**

## Перевірка VITE_API_URL на фронті (Vercel)

Якщо фронт на `www.l2dop.com` або `l2dop.com`:

- **Варіант A (рекомендовано):** `VITE_API_URL=/api` — запити йдуть на той самий домен, Vercel rewrite проксує на api
- **Варіант B:** `VITE_API_URL=https://api.l2dop.com` — cross-origin, cookie має бути з `Domain=.l2dop.com`

## Перевірка в браузері

1. Відкрий DevTools → Application → Cookies
2. Після входу має з'явитися `refresh_token` для домену `.l2dop.com` або `www.l2dop.com`
3. Якщо cookie немає або Domain = `api.l2dop.com` — налаштуй COOKIE_DOMAIN на сервері

## JWT_TTL (опційно)

Якщо access token протухає дуже швидко, перевір `JWT_TTL` на сервері. За замовчуванням `15m` (15 хвилин). Якщо стоїть `5s` — це викличе 401 через 5 секунд.
