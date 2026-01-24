# ⚡ ШВИДКЕ ВИПРАВЛЕННЯ: Can't reach database server

## ❌ Проблема в логах Railway

```
Can't reach database server at `db.hstwsloooubalvpwasst.supabase.co:5432`
```

**Причина:** `DATABASE_URL` вказує на direct connection (порт 5432), який не працює з Railway для runtime.

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ✅ РІШЕННЯ (2 хвилини)

### Крок 1: Відкрити Railway Variables

1. **Railway** → **Settings** → **Variables**
2. Або натиснути **"{} Raw Editor"**

### Крок 2: Змінити DATABASE_URL на pooler

**ЗАМІНИТИ:**
```
postgresql://postgres:markusan2109A@db.hstwsloooubalvpwasst.supabase.co:5432/postgres
```

**НА:**
```
postgresql://postgres.hstwsloooubalvpwasst:markusan2109A@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

### Крок 3: Зберегти

1. Натиснути **"Update Variables"** (або **"Save"**)
2. Railway автоматично перезапустить сервер
3. Зачекати 30-60 секунд

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ✅ Перевірка

Після збереження, в логах Railway має зникнути помилка:
- ❌ `Can't reach database server at ...5432`
- ✅ `Server started on http://0.0.0.0:PORT`

Відкрити в браузері:
- `https://text-rpg-production.up.railway.app/health` → `{"status":"ok"}`

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ⚠️ Важливо

- **Build time:** `DATABASE_URL` може бути direct connection (для migrations)
- **Runtime:** `DATABASE_URL` має бути pooler connection (для додатку)
- Після успішного build завжди повертайте на pooler!

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Якщо не працює

Перевірте:
1. Чи правильно скопійовано URL (без пробілів, лапок)
2. Чи збережено змінну
3. Чи перезапустився сервер (перевірити логи)
