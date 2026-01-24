# 🔧 Правильний формат DATABASE_URL на Railway

## ❌ Помилка

На Railway в полі Value є:
```
DATABASE_URL="postgresql://postgres:ПАРОЛЬ@..."
```

**НЕПРАВИЛЬНО!** В полі Value має бути **ТІЛЬКИ** connection string, без `DATABASE_URL="` і без лапок!

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ✅ Правильний формат

На Railway:

**Key (назва змінної):**
```
DATABASE_URL
```

**Value (значення - ТІЛЬКИ connection string):**
```
postgresql://postgres:ПАРОЛЬ@db.hstwsloooubalvpwasst.supabase.co:5432/postgres
```

**БЕЗ:**
- ❌ `DATABASE_URL="` на початку
- ❌ `"` лапок
- ❌ Ключа в значенні

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ✅ Як виправити

### Варіант 1: Звичайний редактор

1. Railway → **Settings** → **Variables**
2. Знайди `DATABASE_URL`
3. Натисни на три крапки → **Edit** (або натисни на рядок)
4. У полі **Value** видали все, що починається з `DATABASE_URL="`
5. Залиши **ТІЛЬКИ** connection string:
   ```
   postgresql://postgres:ТВІЙ_ПАРОЛЬ@db.hstwsloooubalvpwasst.supabase.co:5432/postgres
   ```
6. Натисни **Save**

**Перевірка:**
- Key: `DATABASE_URL` ✅
- Value: `postgresql://postgres:...` (починається з `postgresql://`) ✅

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### Варіант 2: Raw Editor (РЕКОМЕНДОВАНО)

1. Railway → **Settings** → **Variables**
2. Натисни **"{} Raw Editor"** (праворуч)
3. Якщо там є неправильний формат, видали його
4. Введи:
   ```json
   {
     "DATABASE_URL": "postgresql://postgres:ТВІЙ_ПАРОЛЬ@db.hstwsloooubalvpwasst.supabase.co:5432/postgres"
   }
   ```
5. Заміни `ТВІЙ_ПАРОЛЬ` на реальний пароль
6. Натисни **Save**

Raw Editor автоматично правильно форматує - Key і Value розділені.

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 🎯 Швидке рішення

1. **Railway → Settings → Variables → DATABASE_URL → Edit**
2. У полі **Value** видали все
3. Встав **ТІЛЬКИ** connection string (без `DATABASE_URL="`, без лапок):
   ```
   postgresql://postgres:ПАРОЛЬ@db.hstwsloooubalvpwasst.supabase.co:5432/postgres
   ```
4. **Save**

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ✅ Перевірка

Після збереження:

1. Railway → Settings → Variables
2. Знайди `DATABASE_URL`
3. Перевір:
   - Key: `DATABASE_URL` ✅
   - Value: `postgresql://postgres:...` (починається з `postgresql://`, без лапок) ✅

Якщо все правильно - Railway перезапустить автоматично, помилка має зникнути!
