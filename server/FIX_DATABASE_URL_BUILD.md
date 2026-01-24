# 🔧 Виправлення: DATABASE_URL не знайдено під час build

## ❌ Помилка

```
Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`.
```

Це означає, що `DATABASE_URL` не встановлено або має неправильний формат на Railway.

## ✅ Рішення

### Крок 1: Перевірити DATABASE_URL на Railway

1. Railway → **Settings** → **Variables**
2. Знайти `DATABASE_URL`
3. Перевірити, що:
   - ✅ **Key:** `DATABASE_URL` (точно так, без пробілів)
   - ✅ **Value:** починається з `postgresql://` або `postgres://`
   - ✅ Немає лапок навколо значення
   - ✅ Немає `DATABASE_URL=` в значенні

**ПРАВИЛЬНО:**
```
Key: DATABASE_URL
Value: postgresql://postgres:password@host:5432/postgres
```

**НЕПРАВИЛЬНО:**
```
Key: DATABASE_URL
Value: "postgresql://postgres:password@host:5432/postgres"  ❌ (лапки)
Value: DATABASE_URL=postgresql://...  ❌ (ключ в значенні)
Value: postgresql://...  ❌ (не починається з postgresql://)
```

### Крок 2: Якщо DATABASE_URL відсутній

1. Railway → **Settings** → **Variables**
2. Натиснути **"+ New Variable"**
3. Додати:
   - **Key:** `DATABASE_URL`
   - **Value:** Скопіювати з `DIRECT_URL` (для build) або pooler (для runtime)
   - **Environment:** Всі (Production, Preview, Development)

### Крок 3: Використати DIRECT_URL для build

Якщо `DATABASE_URL` вказує на pooler, а для build потрібен direct connection:

**Варіант А: Тимчасово замінити DATABASE_URL**

1. Railway → **Settings** → **Variables**
2. Знайти `DATABASE_URL`
3. Тимчасово замінити на значення з `DIRECT_URL`:
   ```
   postgresql://postgres:markusan2109A@db.hstwsloooubalvpwasst.supabase.co:5432/postgres
   ```
4. Зберегти - Railway перезапустить build
5. Після успішного деплою повернути на pooler

**Варіант Б: Використати DIRECT_URL в build команді**

Railway → **Settings** → **Build & Deploy** → **Build Command**:

```
npm install && DATABASE_URL="$DIRECT_URL" npm run prisma:generate && DATABASE_URL="$DIRECT_URL" npm run prisma:migrate:deploy && npm run build
```

Якщо Railway не підтримує `$DIRECT_URL`, використати Варіант А.

### Крок 4: Перевірити формат URL

URL має бути в форматі:
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

**Приклад правильного URL:**
```
postgresql://postgres:markusan2109A@db.hstwsloooubalvpwasst.supabase.co:5432/postgres
```

**Перевірка:**
- ✅ Починається з `postgresql://`
- ✅ Містить `:` після `postgresql://`
- ✅ Містить `@` між credentials та host
- ✅ Містить `:` перед портом
- ✅ Містить `/` перед database name

### Крок 5: Перевірити через Raw Editor

Якщо звичайний редактор не працює:

1. Railway → **Settings** → **Variables**
2. Натиснути **"{} Raw Editor"**
3. Перевірити JSON:
   ```json
   {
     "DATABASE_URL": "postgresql://postgres:password@host:5432/postgres"
   }
   ```
4. Зберегти

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ⚠️ Важливо

- **Build time:** Prisma потребує `DATABASE_URL` для `prisma generate` та `prisma migrate deploy`
- **Runtime:** Додаток використовує `DATABASE_URL` з `db.ts`
- Якщо `DATABASE_URL` вказує на pooler, для build потрібно тимчасово використати direct connection

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Перевірка після виправлення

Після встановлення правильного `DATABASE_URL`, в логах має бути:
```
✔ Generated Prisma Client
✔ Applied migration (якщо є)
✓ built in X.XXs
```

Якщо все ще помилка - перевірити формат URL та наявність змінної.
