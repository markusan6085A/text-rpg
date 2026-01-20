# 🔧 Виправлення помилки: MaxClientsInSessionMode на Supabase

## ❌ Помилка

```
Error: Schema engine error:
FATAL: MaxClientsInSessionMode: max clients reached - in Session mode max clients are limited to pool_size
```

Це означає, що Prisma намагається відкрити занадто багато з'єднань до Supabase, які перевищують обмеження connection pool.

## ✅ Рішення

### Варіант 1: Використовувати Direct Connection для Migrations (РЕКОМЕНДОВАНО)

Supabase надає два типи connection strings:
1. **Direct Connection** (для migrations) - без pooler
2. **Connection Pooling** (для runtime) - з pooler

**Крок 1: Отримати обидва connection strings з Supabase**

1. Supabase Dashboard → **Settings** → **Database**
2. У розділі **Connection String** знайдіть:
   - **URI** (Direct connection) - для migrations
   - **Connection pooling** (Transaction mode) - для runtime

**Крок 2: Додати обидва на Railway**

На Railway додайте дві змінні:

**DATABASE_URL** (для runtime - з pooler):
```
postgresql://postgres.xxxxx:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**DIRECT_DATABASE_URL** (для migrations - без pooler):
```
postgresql://postgres.xxxxx:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

**Крок 3: Оновити build команду на Railway**

Railway → **Settings** → **Build & Deploy** → **Build Command**:

```bash
npm install && DATABASE_URL="$DIRECT_DATABASE_URL" npm run prisma:generate && npm run prisma:migrate:deploy && npm run build
```

Це використає direct connection для migrations, а runtime буде використовувати pooler.

---

### Варіант 2: Обмежити Connection Pool Size

Якщо використовуєте тільки один connection string, додайте параметри до URL:

**На Railway:**
```
postgresql://postgres.xxxxx:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=10
```

**Параметри:**
- `pgbouncer=true` - використовувати Transaction mode (не Session mode)
- `connection_limit=1` - максимум 1 з'єднання
- `pool_timeout=10` - чекати 10 секунд на вільне з'єднання

---

### Варіант 3: Використовувати Transaction Mode (якщо доступно)

Якщо Supabase надає Transaction mode pooler, використовуйте його:

```
postgresql://postgres.xxxxx:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

Transaction mode дозволяє більше одночасних з'єднань, ніж Session mode.

---

## ⚠️ Важливо

1. **Migrations потребують Session mode** - тому для `prisma migrate deploy` використовуйте direct connection (порт 5432)
2. **Runtime може використовувати Transaction mode** - тому для додатку використовуйте pooler (порт 6543)
3. **Connection limit** - Supabase має обмеження на кількість одночасних з'єднань (залежить від тарифу)

---

## 🎯 Після виправлення

Після налаштування connection strings:
- ✅ Prisma migrations працюватимуть без помилок
- ✅ Runtime додаток використовуватиме connection pool
- ✅ Не буде помилок "max clients reached"
