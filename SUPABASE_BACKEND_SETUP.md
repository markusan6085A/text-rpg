# 🗄️ Підключення Supabase до Backend (Prisma)

## ✅ Що вже є:
- ✅ Backend сервер (Fastify) в папці `server/`
- ✅ Prisma ORM з PostgreSQL
- ✅ Моделі: Account, Character, InventoryItem, Kv
- ✅ API endpoints для auth та characters

## 📋 Що потрібно зробити:

### Крок 1: Отримати Connection String з Supabase

1. У Supabase Dashboard перейдіть до **Settings** → **Database**
2. Знайдіть розділ **"Connection string"** або **"Connection pooling"**
3. Оберіть **"URI"** (не Transaction mode)
4. Скопіюйте connection string (виглядає як):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.hstwsloooubalvpwasst.supabase.co:5432/postgres
   ```
5. Замініть `[YOUR-PASSWORD]` на ваш Database Password (той, що ви створили при створенні проєкту)

**АБО** використайте **"Connection pooling"** (рекомендовано для production):
```
postgresql://postgres:[YOUR-PASSWORD]@db.hstwsloooubalvpwasst.supabase.co:6543/postgres?pgbouncer=true
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### Крок 2: Створити `.env` в папці `server/`

Створіть файл `server/.env`:

```env
# Database
DATABASE_URL="postgresql://postgres:ВАШ_ПАРОЛЬ@db.hstwsloooubalvpwasst.supabase.co:5432/postgres"

# JWT Secret (для автентифікації)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

**ВАЖЛИВО:** 
- Замініть `ВАШ_ПАРОЛЬ` на реальний Database Password
- Замініть `JWT_SECRET` на випадковий рядок (для безпеки)

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### Крок 3: Запустити міграції Prisma

```bash
cd server
npm run prisma:migrate
```

Це створить всі таблиці в Supabase PostgreSQL.

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### Крок 4: Додати API endpoints для збереження даних

Потрібно додати endpoints для:
- Збереження/завантаження даних героя (heroJson)
- Збереження/завантаження інших даних (battle state, inventory, тощо)

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### Крок 5: Оновити `persistence.ts` для використання backend API

Замість localStorage → виклики до backend API.

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 🎯 План дій:

1. **Отримати Connection String** з Supabase (Settings → Database)
2. **Створити `server/.env`** з DATABASE_URL
3. **Запустити міграції** Prisma
4. **Додати API endpoints** для збереження даних
5. **Оновити `persistence.ts`** для використання API

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 💡 Переваги цього підходу:

✅ Використовуєте існуючий backend
✅ Prisma ORM (типобезпека, міграції)
✅ Централізоване зберігання даних
✅ Легше додавати нові функції
✅ Краще для production

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

**Почніть з кроку 1: отримайте Connection String з Supabase Dashboard → Settings → Database**
