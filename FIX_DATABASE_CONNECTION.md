# 🔧 Виправлення: Can't reach database server

## ❌ Помилка в логах Railway:

```
Can't reach database server at `db.hstwsloooubalvpwasst.supabase.co:5432`
```

Prisma не може підключитися до Supabase.

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ✅ Рішення

### Крок 1: Перевірити DATABASE_URL на Railway

1. Railway → **Settings** → **Variables**
2. Знайди `DATABASE_URL`
3. Натисни на три крапки → **Edit** (або просто натисни на рядок)
4. Перевір формат:

**Правильний формат:**
```
postgresql://postgres:ВАШ_ПАРОЛЬ@db.hstwsloooubalvpwasst.supabase.co:5432/postgres
                                 ↑↑↑
                              ОБОВ'ЯЗКОВО "db." на початку!
```

**Перевір:**
- ✅ Починається з `postgresql://` (НЕ `https://`!)
- ✅ Є пароль після `postgres:`
- ✅ Пароль без пробілів на початку/в кінці
- ✅ Host: `db.hstwsloooubalvpwasst.supabase.co` ⚠️ **ОБОВ'ЯЗКОВО з `db.` на початку!**
- ✅ Port: `5432`
- ✅ Database: `postgres`

**НЕПРАВИЛЬНО:**
```
postgresql://postgres:ПАРОЛЬ@hstwsloooubalvpwasst.supabase.co:5432/postgres
                                      ↑↑↑
                                   НЕМАЄ "db." - НЕ ПРАЦЮЄ!
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### Крок 2: Перевірити пароль

Якщо не впевнений в паролі:

1. Supabase → **Settings** → **Database**
2. Знайди секцію **"Database password"**
3. Натисни **"Reset database password"**
4. Скопіюй новий пароль
5. Онови `DATABASE_URL` на Railway з новим паролем

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### Крок 3: Перевірити Supabase Network Settings

Можливо, Supabase блокує з'єднання:

1. Supabase → **Settings** → **Database**
2. Шукай секцію **"Connection Pooling"** або **"Network"**
3. Перевір, чи дозволені зовнішні підключення

**Якщо є "IP Restrictions":**
- Тимчасово вимкни
- Або додай Railway IP (складніше)

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### Крок 4: Спробувати Connection Pooling (якщо є)

Connection Pooling часто працює краще:

1. Supabase → **Settings** → **Database**
2. Знайди секцію **"Connection Pooling"**
3. Якщо є URL для Connection Pooling, скопіюй його
4. Формат зазвичай:
   ```
   postgresql://postgres:ПАРОЛЬ@db.hstwsloooubalvpwasst.supabase.co:6543/postgres?pgbouncer=true
   ```
5. Онови `DATABASE_URL` на Railway

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 🎯 Швидке рішення

1. **Отримай новий пароль:**
   - Supabase → Settings → Database → Reset database password

2. **Онови DATABASE_URL на Railway:**
   ```
   postgresql://postgres:НОВИЙ_ПАРОЛЬ@db.hstwsloooubalvpwasst.supabase.co:5432/postgres
                                 ↑↑↑
                              ОБОВ'ЯЗКОВО "db." на початку!
   ```

3. **Збережи** - Railway перезапустить автоматично

4. **Перевір логи** - помилка "Can't reach database server" має зникнути

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ❓ Якщо все одно не працює

1. Перевір, чи Supabase проект активний (не сплячий)
2. Перевір, чи правильний project ref (`hstwsloooubalvpwasst`)
3. Спробуй Connection Pooling замість прямого підключення
