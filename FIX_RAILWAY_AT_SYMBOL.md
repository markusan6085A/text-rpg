# 🔧 Railway прибирає символ @ з DATABASE_URL

## ❌ Проблема

Коли зберігаєш `DATABASE_URL` на Railway, символ `@` автоматично прибирається.

**Connection string має бути:**
```
postgresql://postgres:ПАРОЛЬ@db.hstwsloooubalvpwasst.supabase.co:5432/postgres
                            ↑
                         @ обов'язковий!
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ✅ Рішення 1: URL Encoding (найпростіше)

Заміни `@` на `%40`:

**Було:**
```
postgresql://postgres:ПАРОЛЬ@db.hstwsloooubalvpwasst.supabase.co:5432/postgres
```

**Заміни на:**
```
postgresql://postgres:ПАРОЛЬ%40db.hstwsloooubalvpwasst.supabase.co:5432/postgres
                            ↑↑↑
                         %40 замість @
```

**Приклад:**
Якщо пароль: `mypass123`
То буде:
```
postgresql://postgres:mypass123%40db.hstwsloooubalvpwasst.supabase.co:5432/postgres
```

⚠️ **Стоп!** Це неправильно! `@` має бути **ПІСЛЯ** пароля, а не всередині!

**ПРАВИЛЬНО:**
```
postgresql://postgres:mypass123@db.hstwsloooubalvpwasst.supabase.co:5432/postgres
                            ↑      ↑
                         пароль  @
```

**Якщо Railway прибирає @, спробуй:**

```
postgresql://postgres:mypass123%40db.hstwsloooubalvpwasst.supabase.co:5432/postgres
```

Але це може не спрацювати. Краще спробувати Raw Editor.

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ✅ Рішення 2: Raw Editor на Railway

1. Railway → **Settings** → **Variables**
2. Знайди кнопку **"{} Raw Editor"** (праворуч від "+ New Variable")
3. Натисни на неї
4. Введи в JSON форматі:
   ```json
   {
     "DATABASE_URL": "postgresql://postgres:ТВІЙ_ПАРОЛЬ@db.hstwsloooubalvpwasst.supabase.co:5432/postgres"
   }
   ```
5. Заміни `ТВІЙ_ПАРОЛЬ` на реальний пароль
6. Натисни **Save**

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ✅ Рішення 3: Railway CLI

Якщо встановлено Railway CLI:

```bash
railway variables set DATABASE_URL="postgresql://postgres:ПАРОЛЬ@db.hstwsloooubalvpwasst.supabase.co:5432/postgres"
```

Заміни `ПАРОЛЬ` на реальний пароль.

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 🎯 Швидке рішення

1. Спробуй **Raw Editor** (Рішення 2) - найімовірніше спрацює
2. Якщо не спрацює - спробуй URL encoding `%40` (Рішення 1)
3. Якщо все одно не працює - Railway CLI (Рішення 3)

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ❓ Якщо все одно не працює

Можливо, Railway має баг. Спробуй:
- Перевірити, чи правильний формат в Railway UI
- Можливо, потрібно використати Connection Pooling замість прямого підключення
