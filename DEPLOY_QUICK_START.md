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

## Крок 2: Деплой Backend на Railway

### 2.1. Реєстрація
1. Перейти на https://railway.app
2. Натиснути "Login" → "Login with GitHub"
3. Дозволити доступ до GitHub

### 2.2. Створити проект
1. Натиснути **"New Project"**
2. Вибрати **"Deploy from GitHub repo"**
3. Вибрати ваш репозиторій `text-rpg`
4. Railway почне деплой (поки що буде помилка - це нормально)

### 2.3. Налаштувати сервіс
1. Після створення проекту, Railway покаже сервіс
2. Натиснути на сервіс → **Settings** → **Root Directory**
3. Встановити: `server`
4. Натиснути **Save**

### 2.4. Environment Variables
1. В проєкті → **Variables** tab
2. Додати змінні:

**DATABASE_URL:**
- Відкрити `server/.env`
- Скопіювати значення `DATABASE_URL=...`
- В Railway додати: `DATABASE_URL` = (вставити значення)

**JWT_SECRET:**
- Згенерувати секретний ключ:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
- Скопіювати результат
- В Railway додати: `JWT_SECRET` = (вставити результат)

**PORT (опціонально):**
- Railway сам встановить PORT, але можна додати: `PORT` = `3000`

### 2.5. Налаштувати Build/Start команди
1. В Settings → **Deploy**
2. Build Command: `npm install && npm run prisma:generate && npm run build`
3. Start Command: `npm start`
4. Натиснути **Save**

### 2.6. Отримати URL
1. В Settings → **Networking**
2. Натиснути **Generate Domain**
3. Скопіювати URL (типу `your-app.railway.app`)
4. Це буде ваш backend URL!

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
   - **Value:** `https://ваш-backend-url.railway.app` (з Кроку 2.6)
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
2. В Railway → Variables
3. Додати:
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

Закомітити та запушити зміни. Railway автоматично перезадеплоїть.

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 5: Тестування

1. Відкрити frontend URL (з Vercel)
2. Спробувати зареєструватися
3. Спробувати залогінитися
4. Перевірити, що персонаж зберігається

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ❌ Якщо щось не працює:

### Backend не запускається:
- Перевірити логи в Railway (Deployments → View Logs)
- Перевірити, що DATABASE_URL правильний
- Перевірити, що JWT_SECRET встановлений

### Frontend не підключається до backend:
- Перевірити, що `VITE_API_URL` правильний
- Перевірити CORS налаштування
- Відкрити DevTools → Network, перевірити помилки

### CORS помилки:
- Перевірити, що FRONTEND_URL додано в Railway
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

**Backend:**
```bash
git add .
git commit -m "Update backend"
git push
# Railway автоматично перезадеплоїть
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

1. **Безкоштовні ліміти:**
   - Railway: $5 credit/місяць (достатньо для початку)
   - Vercel: 100GB bandwidth/місяць (достатньо для початку)

2. **Моніторинг:**
   - Railway показує логи в реальному часі
   - Vercel показує analytics та логи

3. **Кастомний домен:**
   - Vercel: Settings → Domains → Add Domain
   - Railway: Settings → Networking → Custom Domain
