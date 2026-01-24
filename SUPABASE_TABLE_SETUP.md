# 📊 Створення таблиці user_data в Supabase

## Крок 1: Отримати API ключі

1. У лівому меню → **"PROJECT SETTINGS"** → **"API Keys"**
2. Знайдіть розділ **"Project API keys"**
3. Запишіть:
   - **Project URL:** `https://hstwsloooubalvpwasst.supabase.co`
   - **anon public key:** `eyJhbGc...` (довгий рядок)

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 2: Створити таблицю

### 2.1. Відкрити Table Editor

1. У лівому меню натисніть **"Database"** (іконка таблиці 📊)
2. Перейдіть до вкладки **"Table Editor"**
3. Натисніть кнопку **"New Table"** (зелена кнопка зверху)

### 2.2. Налаштування таблиці

**Table name:** `user_data`

**Додайте колонки (Add Column):**

1. **Перша колонка (id):**
   - **Name:** `id`
   - **Type:** `uuid`
   - ✅ **Primary Key** (включити)
   - **Default value:** `gen_random_uuid()`
   - ✅ **Is Nullable** (вимкнути - NOT NULL)

2. **Друга колонка (user_id):**
   - **Name:** `user_id`
   - **Type:** `text`
   - ✅ **Is Nullable** (вимкнути - NOT NULL)

3. **Третя колонка (key):**
   - **Name:** `key`
   - **Type:** `text`
   - ✅ **Is Nullable** (вимкнути - NOT NULL)

4. **Четверта колонка (value):**
   - **Name:** `value`
   - **Type:** `jsonb`
   - ✅ **Is Nullable** (вимкнути - NOT NULL)

5. **П'ята колонка (created_at):**
   - **Name:** `created_at`
   - **Type:** `timestamptz`
   - **Default value:** `now()`
   - ✅ **Is Nullable** (залишити включеним - може бути NULL)

6. **Шоста колонка (updated_at):**
   - **Name:** `updated_at`
   - **Type:** `timestamptz`
   - **Default value:** `now()`
   - ✅ **Is Nullable** (залишити включеним - може бути NULL)

### 2.3. Зберегти таблицю

Натисніть кнопку **"Save"** (або "Create table")

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 3: Створити індекс

1. Після створення таблиці, натисніть на назву таблиці `user_data` у списку
2. Перейдіть до вкладки **"Indexes"**
3. Натисніть **"Create Index"** (або "New Index")
4. Заповніть:
   - **Index name:** `idx_user_data_user_key`
   - **Columns:** 
     - Вибрати `user_id`
     - Вибрати `key`
   - ✅ **Unique** (включити - унікальний індекс)
5. Натисніть **"Save"**

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 4: Створити .env.local

Після отримання API ключів, створіть файл `.env.local` в корені проєкту (поряд з `package.json`):

```env
VITE_SUPABASE_URL=https://hstwsloooubalvpwasst.supabase.co
VITE_SUPABASE_ANON_KEY=ваш_anon_public_ключ_тут
```

**ВАЖЛИВО:** Замініть `ваш_anon_public_ключ_тут` на реальний ключ з Settings → API Keys.

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Готово! 🎉

Після цього я допоможу вам:
1. Встановити `@supabase/supabase-js`
2. Створити Supabase клієнт
3. Оновити `persistence.ts` для використання Supabase
