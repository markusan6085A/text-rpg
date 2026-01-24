# 🔍 Кроки для діагностики помилки "Internal Server Error"

## ✅ Крок 1: Перевірити логи Backend сервера

**Найважливіше:** Подивіться в термінал, де запущений backend сервер (`cd server && npm run dev`).

Там мають бути детальні логи помилки, які покажуть точну причину.

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ✅ Крок 2: Перевірити, що backend сервер запущений

```bash
cd server
npm run dev
```

Backend має запуститися на `http://localhost:3000`.

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ✅ Крок 3: Перевірити .env файл

Переконайтеся, що `server/.env` налаштований:

```env
DATABASE_URL="postgresql://postgres:ВАШ_ПАРОЛЬ@db.xxxxx.supabase.co:5432/postgres"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ✅ Крок 4: Перевірити Prisma міграції

Переконайтеся, що міграції застосовані:

```bash
cd server
npm run prisma:migrate
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ✅ Крок 5: Перевірити Prisma Client

Переконайтеся, що Prisma Client згенерований:

```bash
cd server
npm run prisma:generate
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ✅ Крок 6: Перевірити RLS в Supabase

Якщо RLS увімкнений, але немає правил доступу, запити будуть блокуватися.

**Для тестування можна вимкнути RLS:**
1. Відкрити Supabase Dashboard
2. Перейти в **Table Editor**
3. Вибрати таблицю `Character`
4. Натиснути **"..."** → **"RLS"**
5. Переконайтеся, що RLS вимкнений (для тестування)

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 📝 Що шукати в логах:

1. **Помилка підключення до бази даних:**
   - `Can't reach database server`
   - `Connection refused`
   - `Authentication failed`

2. **Помилка Prisma:**
   - `Prisma Client is not generated`
   - `Table does not exist`
   - `Permission denied`

3. **Помилка JWT:**
   - `JWT_SECRET is missing`
   - `Token verification failed`

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

**Найпростіше:** Подивіться логи в терміналі backend сервера - там буде точна причина помилки!
