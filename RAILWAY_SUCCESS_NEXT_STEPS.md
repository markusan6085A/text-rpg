# ✅ Backend задеплоєно! Що далі?

## ✅ Статус:
- Backend запустився успішно на Railway
- Сервер слухає на порту 3000
- Статус: **Online** (зелена точка)

---

## Крок 1: Отримати URL backend

1. В Railway перейти в **Settings** → **Networking**
2. Натиснути **"Generate Domain"** (або подивитися наявний domain)
3. Скопіювати URL (типу `text-rpg-production.up.railway.app`)
4. Це буде ваш backend URL!

---

## Крок 2: Перевірити роботу backend

1. Відкрити URL в браузері
2. Або відкрити URL + `/health`
3. Має показати: `{"status":"ok"}`

---

## Крок 3: Додати Environment Variables (якщо ще не додали)

1. **Settings** → **Variables**
2. Додати:
   - `DATABASE_URL` = (з `server/.env`)
   - `JWT_SECRET` = (довгий ключ)
   - `NODE_ENV` = `production`

---

## Крок 4: Деплой Frontend на Vercel

Тепер потрібно задеплоїти frontend:

1. Перейти на https://vercel.com
2. **New Project** → Підключити GitHub репозиторій `text-rpg`
3. Налаштування:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (корінь)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables:**
   - `VITE_API_URL` = `https://ваш-railway-url.railway.app`
5. **Deploy!**

---

## Крок 5: Налаштувати CORS (якщо потрібно)

Якщо frontend на іншому домені, потрібно оновити CORS в backend:

Оновити `server/src/index.ts`:
```typescript
await app.register(cors, {
  origin: [
    'http://localhost:5173',
    'https://ваш-frontend-url.vercel.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

Закомітити та запушити - Railway автоматично перезадеплоїть.

---

## ✅ Готово!

Після деплою frontend:
- ✅ Backend працює на Railway
- ✅ Frontend працює на Vercel
- ✅ Всі API запити йдуть на Railway backend
- ✅ Гра доступна онлайн!
