# 🔧 Помилка: URL must start with postgresql://

## ❌ Помилка в логах Railway:

```
error: Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`.
```

Це означає, що `DATABASE_URL` на Railway неправильний - він не починається з `postgresql://` або `postgres://`.

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ✅ Рішення

### Крок 1: Перевірити DATABASE_URL на Railway

1. Railway → **Settings** → **Variables**
2. Знайди `DATABASE_URL`
3. Натисни на три крапки → **Edit** (або просто натисни на рядок)
4. Перевір, чи починається з `postgresql://`

**ПРАВИЛЬНО:**
```
postgresql://postgres:ПАРОЛЬ@db.hstwsloooubalvpwasst.supabase.co:5432/postgres
↑↑↑↑↑↑↑↑↑↑↑
Має починатися з "postgresql://"
```

**НЕПРАВИЛЬНО:**
- `https://postgres:...` ❌
- `db.hstwsloooubalvpwasst.supabase.co:...` ❌
- `postgres:ПАРОЛЬ@...` ❌
- Порожнє ❌

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### Крок 2: Виправити через Raw Editor (РЕКОМЕНДОВАНО)

Якщо звичайний редактор не працює:

1. Railway → **Settings** → **Variables**
2. Знайди кнопку **"{} Raw Editor"** (праворуч від "+ New Variable")
3. Натисни на неї
4. Введи в JSON форматі:
   ```json
   {
     "DATABASE_URL": "postgresql://postgres:ТВІЙ_ПАРОЛЬ@db.hstwsloooubalvpwasst.supabase.co:5432/postgres"
   }
   ```
5. Заміни `ТВІЙ_ПАРОЛЬ` на реальний пароль з Supabase
6. Натисни **Save**

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### Крок 3: Перевірити після збереження

1. Закрий Raw Editor
2. Перевір в звичайному редакторі - `DATABASE_URL` має починатися з `postgresql://`
3. Railway автоматично перезапустить
4. Зачекай 1-2 хвилини
5. Перевір логи - помилка "URL must start with postgresql://" має зникнути

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 🎯 Швидке рішення

1. **Raw Editor** на Railway
2. Введи JSON з `DATABASE_URL` (починається з `postgresql://`)
3. Збережи
4. Зачекай 1-2 хвилини
5. Перевір логи

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ❓ Якщо все одно не працює

1. Перевір, чи пароль правильний
2. Спробуй створити новий пароль в Supabase (Reset database password)
3. Перевір, чи правильний host (`db.hstwsloooubalvpwasst.supabase.co`)
