# 🔧 Виправлення Railway деплою

## Проблема:
Railway намагається деплоїти frontend (корінь проєкту) замість backend (папка `server/`).

## Рішення:

### Крок 1: Відкрити Settings проєкту
1. В Railway проєкті натиснути **"Settings"**

### Крок 2: Налаштувати Source
1. Знайти секцію **"Source"**
2. Перевірити:
   - **Branch:** `2025-12-23-zsq5` (або `main` якщо змержили)
   - **Root Directory:** `server` ⚠️ ВАЖЛИВО!
   - **Auto Deploy:** Enabled

### Крок 3: Налаштувати Build & Deploy
1. Знайти секцію **"Build & Deploy"**
2. Встановити:
   - **Build Command:** `npm install && npm run prisma:generate && npm run build`
   - **Start Command:** `npm start`

### Крок 4: Додати Environment Variables
1. **Variables** → **+ New Variable**
2. Додати:
   - `DATABASE_URL` = (з `server/.env`)
   - `JWT_SECRET` = (згенерувати: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
   - `NODE_ENV` = `production`

### Крок 5: Зберегти та передеплоїти
1. Натиснути **"Save"**
2. Railway автоматично почне новий деплой
3. Перевірити логи - тепер має компілювати TypeScript з `server/src/`, а не з кореня

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Альтернатива: Створити новий сервіс

Якщо налаштування не працює:

1. Видалити поточний сервіс
2. Створити новий сервіс
3. Під час створення вказати:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npm run prisma:generate && npm run build`
   - **Start Command:** `npm start`
