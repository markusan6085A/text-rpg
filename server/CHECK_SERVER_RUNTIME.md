# 🔍 Перевірка: Чому гра не завантажується

## ❌ Проблема
Гра показує "Internal Server Error" на сторінці логіну, хоча Railway деплой успішний.

## ✅ Діагностика

### Крок 1: Перевірити, чи сервер запускається

1. **Railway** → **Logs**
2. Шукати рядок: `Server started on http://0.0.0.0:PORT`
3. Якщо немає - сервер не запускається

**Можливі причини:**
- Помилка підключення до БД
- Помилка в коді при старті
- Неправильний `DATABASE_URL`

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### Крок 2: Перевірити DATABASE_URL для runtime

**ВАЖЛИВО:** Для runtime (після build) `DATABASE_URL` має вказувати на **pooler**, а не direct connection!

1. **Railway** → **Settings** → **Variables**
2. Перевірити `DATABASE_URL`:
   
   **ПРАВИЛЬНО (для runtime):**
   ```
   postgresql://postgres.hstwsloooubalvpwasst:markusan2109A@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```
   (порт 6543, pooler)

   **НЕПРАВИЛЬНО:**
   ```
   postgresql://postgres:markusan2109A@db.hstwsloooubalvpwasst.supabase.co:5432/postgres
   ```
   (порт 5432, direct connection - працює тільки для migrations)

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### Крок 3: Перевірити логи на помилки

**Railway** → **Logs**, шукати:
- `Failed to connect to database` - проблема з підключенням до БД
- `Error validating datasource` - неправильний `DATABASE_URL`
- `Internal Server Error` - помилка в коді

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### Крок 4: Перевірити health endpoint

Відкрити в браузері:
```
https://text-rpg-production.up.railway.app/health
```

**Має показати:**
```json
{"status":"ok"}
```

Якщо не працює - сервер не запускається.

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### Крок 5: Перевірити root endpoint

Відкрити в браузері:
```
https://text-rpg-production.up.railway.app/
```

**Має показати:**
```json
{
  "name": "Text RPG Server",
  "version": "1.0.0",
  "status": "running",
  ...
}
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 🔧 Швидке виправлення

### Якщо DATABASE_URL вказує на direct connection (порт 5432):

1. **Railway** → **Settings** → **Variables**
2. Знайти `DATABASE_URL`
3. Замінити на pooler connection:
   ```
   postgresql://postgres.hstwsloooubalvpwasst:markusan2109A@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```
4. **Зберегти** - Railway автоматично перезапустить сервер

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ⚠️ Важливо

- **Build time:** `DATABASE_URL` може бути direct connection (для migrations)
- **Runtime:** `DATABASE_URL` має бути pooler connection (для додатку)
- Після успішного build можна змінити `DATABASE_URL` на pooler

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Перевірка після виправлення

1. Railway → Logs → має бути: `Server started on http://0.0.0.0:PORT`
2. Відкрити `/health` → має показати `{"status":"ok"}`
3. Спробувати логін в грі → має працювати
