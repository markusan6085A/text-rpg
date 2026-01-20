# 🔧 Виправлення Build на Railway з DIRECT_URL

## ❌ Проблема

Railway не деплоїть, бо:
- `DATABASE_URL` вказує на pooler (порт 6543) - не підтримує migrations
- `prisma migrate deploy` потребує direct connection (порт 5432)

## ✅ Рішення

### Крок 1: Перевірити змінні на Railway

На Railway → **Settings** → **Variables** мають бути:

1. **`DATABASE_URL`** (для runtime - з pooler):
   ```
   postgresql://postgres.hstwsloooubalvpwasst:markusan2109A@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```

2. **`DIRECT_URL`** (для migrations - direct connection):
   ```
   postgresql://postgres:markusan2109A@db.hstwsloooubalvpwasst.supabase.co:5432/postgres
   ```

### Крок 2: Оновити Build Command на Railway

Railway → **Settings** → **Build & Deploy** → **Build Command**:

**ЗАМІНИТИ:**
```
npm install && npm run prisma:generate && npm run build
```

**НА:**
```
npm install && DATABASE_URL="$DIRECT_URL" npm run prisma:generate && DATABASE_URL="$DIRECT_URL" npm run prisma:migrate:deploy && npm run build
```

Або якщо Railway не підтримує `$DIRECT_URL`, використати:

```
npm install && npm run prisma:generate && npm run prisma:migrate:deploy && npm run build
```

Але тоді потрібно тимчасово замінити `DATABASE_URL` на `DIRECT_URL` для migrations.

### Крок 3: Альтернативне рішення (якщо Railway не підтримує $DIRECT_URL)

Створити окремий скрипт для migrations:

**Додати в `server/package.json`:**
```json
"prisma:migrate:deploy:direct": "DATABASE_URL=\"$DIRECT_URL\" prisma migrate deploy"
```

**Build Command на Railway:**
```
npm install && npm run prisma:generate && npm run prisma:migrate:deploy:direct && npm run build
```

### Крок 4: Найпростіше рішення (РЕКОМЕНДОВАНО)

Якщо Railway не підтримує `$DIRECT_URL` в build команді:

1. **Тимчасово** замінити `DATABASE_URL` на `DIRECT_URL` в Variables
2. Запустити деплой (migrations виконаються)
3. **Повернути** `DATABASE_URL` на pooler connection
4. Оновити build команду, щоб не запускати migrations (вони вже виконані):
   ```
   npm install && npm run prisma:generate && npm run build
   ```

---

## ⚠️ Важливо

- **Runtime** (після build) використовує `DATABASE_URL` з pooler ✅
- **Migrations** (під час build) потребують `DIRECT_URL` з direct connection ✅
- Після першого успішного деплою migrations можна прибрати з build команди
