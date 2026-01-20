# 🔧 Виправлення: Can't reach database server

## ❌ Помилка

```
Error: P1001: Can't reach database server at `db.hstwsloooubalvpwasst.supabase.co:5432`
```

Це означає, що Prisma не може підключитися до direct connection Supabase під час migrations.

## ✅ Рішення

### Варіант 1: Прибрати migrations з build (РЕКОМЕНДОВАНО)

Якщо migrations вже виконані в БД, просто прибрати їх з build команди:

1. **Railway** → **Settings** → **Build & Deploy**
2. **Build Command** змінити на:
   ```
   npm install && npm run prisma:generate && npm run build
   ```
   (прибрати `npm run prisma:migrate:deploy`)

Migrations потрібні тільки при першому деплої або коли є нові зміни в схемі.

---

### Варіант 2: Використати pooler connection для migrations

Якщо Supabase блокує direct connection з Railway, можна використати pooler:

1. **Railway** → **Settings** → **Variables**
2. Переконатися, що `DATABASE_URL` вказує на pooler:
   ```
   postgresql://postgres.hstwsloooubalvpwasst:markusan2109A@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```
3. **Build Command** залишити:
   ```
   npm install && npm run prisma:generate && npm run prisma:migrate:deploy && npm run build
   ```

**⚠️ Увага:** Pooler може не підтримувати всі типи migrations. Якщо не працює - використати Варіант 1.

---

### Варіант 3: Виконати migrations вручну в Supabase

Якщо migrations потрібні, але Railway не може підключитися:

1. **Supabase Dashboard** → **SQL Editor**
2. Відкрити файл `server/prisma/migrations/` (якщо є)
3. Виконати SQL міграції вручну

Або використати Prisma Studio локально:
```bash
cd server
npm run prisma:studio
```

---

### Варіант 4: Перевірити Supabase налаштування

Можливо, Supabase блокує з'єднання з Railway через firewall:

1. **Supabase Dashboard** → **Settings** → **Database**
2. Перевірити **Connection Pooling** налаштування
3. Перевірити, чи дозволені з'єднання з Railway IP

---

## 🎯 Рекомендація

**Найпростіше:** Використати **Варіант 1** - прибрати migrations з build команди, якщо:
- ✅ Таблиці вже створені в БД
- ✅ Немає нових змін в схемі Prisma
- ✅ Сервер працює без migrations

Migrations потрібні тільки при:
- Першому деплої (створення таблиць)
- Зміні схеми Prisma (додавання нових полів/таблиць)

---

## Перевірка після виправлення

Після змін, в логах Railway має бути:
```
✔ Generated Prisma Client
✓ built in X.XXs
Server started on http://0.0.0.0:PORT
```

Якщо все ще помилка - перевірити `DATABASE_URL` формат та доступність Supabase.
