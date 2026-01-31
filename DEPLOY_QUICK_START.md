# 🚀 Швидкий деплой (15-30 хвилин)

## Що потрібно:
- GitHub репозиторій (якщо ще немає - створити)
- Supabase DATABASE_URL (вже є в `server/.env`)
- JWT_SECRET (згенерувати)

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 1: Підготувати код для GitHub

```bash
# Перевірити, що все закомічено
git status

# Якщо є зміни:
git add .
git commit -m "Ready for deployment"
git push
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 2: Деплой Backend на VPS

Backend деплоїться на VPS (наприклад, l2dop.com). Див. `VPS_QUICK_DEPLOY.md` та `server/deploy-vps.sh`.

**Коротко:**
1. SSH на VPS: `ssh root@116.203.243.128`
2. Перейти в `/opt/text-rpg`, виконати `git pull`
3. Запустити `./server/deploy-vps.sh`
4. Backend URL (якщо frontend і backend на одному домені): `https://l2dop.com`

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 3: Деплой Frontend на Vercel

### 3.1. Реєстрація
1. Перейти на https://vercel.com
2. Натиснути "Sign Up" → "Continue with GitHub"
3. Дозволити доступ до GitHub

### 3.2. Додати проєкт
1. Натиснути **"Add New..."** → **"Project"**
2. Знайти репозиторій `text-rpg`
3. Натиснути **"Import"**

### 3.3. Налаштування
1. **Framework Preset:** Vite (має визначитися автоматично)
2. **Root Directory:** `./` (корінь)
3. **Build Command:** `npm run build` (за замовчуванням)
4. **Output Directory:** `dist` (за замовчуванням)

### 3.4. Environment Variables
1. В секції **Environment Variables**
2. Додати:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://l2dop.com` (або URL вашого backend на VPS)
3. Натиснути **Add**
4. Перевірити, що вибрано **Production**, **Preview**, **Development**

### 3.5. Deploy!
1. Натиснути **"Deploy"**
2. Дочекатися завершення (1-2 хвилини)
3. Отримаєте URL типу `text-rpg.vercel.app`

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 4: Налаштувати CORS на Backend

Після деплою frontend, потрібно оновити CORS на backend:

1. Отримати frontend URL з Vercel (Крок 3.5)
2. На VPS: додати в `server/.env` або env змінні:
   - **Key:** `FRONTEND_URL`
   - **Value:** `https://ваш-frontend-url.vercel.app`

Потім оновити `server/src/index.ts`:

```typescript
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

await app.register(cors, {
  origin: [
    'http://localhost:5173', // Для локальної розробки
    'http://localhost:5174',
    frontendUrl, // Production
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

Закомітити та запушити зміни. На VPS виконати `./server/deploy-vps.sh` для перезадеплою.

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 5: Тестування

1. Відкрити frontend URL (з Vercel)
2. Спробувати зареєструватися
3. Спробувати залогінитися
4. Перевірити, що персонаж зберігається

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ❌ Якщо щось не працює:

### Backend не запускається:
- Перевірити логи на VPS (`pm2 logs` або `journalctl -u text-rpg`)
- Перевірити, що DATABASE_URL правильний
- Перевірити, що JWT_SECRET встановлений

### Frontend не підключається до backend:
- Перевірити, що `VITE_API_URL` правильний
- Перевірити CORS налаштування
- Відкрити DevTools → Network, перевірити помилки

### CORS помилки:
- Перевірити, що FRONTEND_URL/дозволені домени в `server/src/index.ts`
- Перевірити, що `server/src/index.ts` оновлений
- Перезадеплоїти backend

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ✅ Готово!

Після успішного деплою:
- ✅ Гра доступна онлайн
- ✅ Дані зберігаються в Supabase
- ✅ Авторизація працює
- ✅ Все синхронізується між пристроями

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 🔄 Оновлення після змін:

**Backend (VPS):**
```bash
# Локально:
git add .
git commit -m "Update backend"
git push

# На VPS:
cd /opt/text-rpg && git pull && ./server/deploy-vps.sh
```

**Frontend:**
```bash
git add .
git commit -m "Update frontend"
git push
# Vercel автоматично перезадеплоїть
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 💡 Підказки:

1. **Моніторинг:**
   - VPS: `pm2 logs` або `journalctl -u text-rpg`
   - Vercel: analytics та логи

2. **Кастомний домен:**
   - Vercel: Settings → Domains → Add Domain
   - VPS: налаштувати Nginx/Caddy для l2dop.com
