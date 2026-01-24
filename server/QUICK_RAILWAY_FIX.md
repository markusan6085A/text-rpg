# ⚡ Швидке виправлення Railway Build

## Проблема
Railway не деплоїть, бо `prisma migrate deploy` не може виконатися через pooler connection.

## ✅ Швидке рішення (2 хвилини)

### Варіант 1: Тимчасово використати DIRECT_URL для migrations

1. **Railway** → **Settings** → **Variables**
2. **Тимчасово** змінити `DATABASE_URL` на значення з `DIRECT_URL`:
   ```
   postgresql://postgres:markusan2109A@db.hstwsloooubalvpwasst.supabase.co:5432/postgres
   ```
3. **Зберегти** - Railway автоматично перезапустить build
4. Після успішного деплою **повернути** `DATABASE_URL` на pooler:
   ```
   postgresql://postgres.hstwsloooubalvpwasst:markusan2109A@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```

### Варіант 2: Прибрати migrations з build (якщо вже виконані)

Якщо migrations вже виконані в БД:

1. **Railway** → **Settings** → **Build & Deploy**
2. **Build Command** змінити на:
   ```
   npm install && npm run prisma:generate && npm run build
   ```
   (прибрати `npm run prisma:migrate:deploy`)

### Варіант 3: Використати DIRECT_URL в build команді

1. **Railway** → **Settings** → **Build & Deploy**
2. **Build Command** змінити на:
   ```
   npm install && npm run prisma:generate && DIRECT_URL="$DIRECT_URL" npm run prisma:migrate:deploy && npm run build
   ```

Якщо Railway не підтримує `$DIRECT_URL`, використати Варіант 1.

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Перевірка

Після змін перевірити логи Railway:
- Має бути: `✔ Generated Prisma Client`
- Має бути: `✔ Applied migration` (якщо є нові migrations)
- Має бути: `✓ built in X.XXs`

Якщо є помилка `MaxClientsInSessionMode` - використати Варіант 1.
