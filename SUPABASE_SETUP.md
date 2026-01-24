# 🗄️ Налаштування Supabase для Text-RPG

## ✅ РЕКОМЕНДАЦІЯ: Реєстрація через GitHub

**Чому GitHub?**
- ✅ У вас вже є GitHub акаунт
- ✅ Швидкий вхід (один клік)
- ✅ Легше інтегрувати з репозиторіями
- ✅ Можна використовувати GitHub Actions для CI/CD
- ✅ Краще для довготривалої розробки

**Реєстрація через Email** теж працює, але для розробки GitHub зручніше.

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 1: Реєстрація на Supabase

1. Відкрийте [https://supabase.com](https://supabase.com)
2. Натисніть кнопку **"Start your project"** або **"Sign Up"**
3. Виберіть **"Sign up with GitHub"**
4. Авторизуйтеся через GitHub (якщо вже залогінений)
5. Надайте дозволи Supabase (Supabase потребує доступу до профілю)

**Готово!** Ви зареєстровані через GitHub.

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 2: Створення проєкту

1. Після входу натисніть **"New Project"**
2. Якщо потрібно створити Organization:
   - Натисніть **"New Organization"**
   - Назва: `text-rpg` (або як хочете)
   - Натисніть **"Create Organization"**

3. Заповніть форму проєкту:
   - **Organization:** Оберіть вашу організацію
   - **Project Name:** `text-rpg` (назва проєкту)
   - **Database Password:** Створіть надійний пароль (**ЗАПИШІТЬ ЙОГО!**)
     - Приклад: `TextRPG2024!SecurePass`
   - **Region:** Оберіть найближчий регіон:
     - `Europe West` (Frankfurt) - якщо в Європі
     - `Central US` (Iowa) - якщо в США
   - **Pricing Plan:** `Free` (безкоштовний план достатній для початку)

4. Натисніть **"Create new project"**
5. Зачекайте 1-2 хвилини, поки проєкт створюється

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 3: Отримання API ключів

1. Після створення проєкту перейдіть до **Dashboard**
2. У лівому меню натисніть **"Settings"** (іконка ⚙️)
3. Виберіть **"API"** в підменю
4. Знайдіть розділ **"Project API keys"**

**ВАЖЛИВО:** Запишіть ці дані (потрібні для налаштування):

- **Project URL:** `https://xxxxx.supabase.co` (це ваш API URL)
- **anon public key:** `eyJhbGc...` (публічний ключ, безпечний для клієнта)
- **service_role secret key:** `eyJhbGc...` (ТІЛЬКИ для backend, НЕ використовуйте в клієнті!)

**Приклад:**
```
Project URL: https://abcdefghijklmnop.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMDU2NzI4OSwiZXhwIjoxOTQ2MTQzMjg5fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

5. **Також запишіть Database Password** (той, що ви створили на кроці 2)

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 4: Створення таблиці для зберігання даних

1. У лівому меню натисніть **"Table Editor"**
2. Натисніть **"New Table"**
3. Створіть таблицю:

   **Table name:** `user_data`

   **Columns:**
   - `id` - тип `uuid`, Primary Key, Default: `gen_random_uuid()`
   - `user_id` - тип `text`, Not null
   - `key` - тип `text`, Not null
   - `value` - тип `jsonb`, Not null
   - `created_at` - тип `timestamptz`, Default: `now()`
   - `updated_at` - тип `timestamptz`, Default: `now()`

4. Натисніть **"Save"**

5. Створіть унікальний індекс для швидкого пошуку:
   - Натисніть на таблицю `user_data`
   - Перейдіть до вкладки **"Indexes"**
   - Натисніть **"Create Index"**
   - **Index name:** `idx_user_data_user_key`
   - **Columns:** `user_id`, `key`
   - **Unique:** включити
   - Натисніть **"Save"**

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 5: Налаштування Row Level Security (RLS)

**ВАЖЛИВО:** Це потрібно для безпеки - кожен користувач має доступ тільки до своїх даних.

1. У лівому меню натисніть **"Authentication"** → **"Policies"**
2. Виберіть таблицю `user_data`
3. Натисніть **"New Policy"**
4. Оберіть **"Create a policy from scratch"**
5. Налаштуйте:
   - **Policy name:** `Users can manage their own data`
   - **Allowed operation:** `ALL` (SELECT, INSERT, UPDATE, DELETE)
   - **Policy definition:** 
   ```sql
   (auth.uid()::text = user_id)
   ```
   АБО якщо використовуємо text user_id:
   ```sql
   (auth.uid()::text = user_id OR auth.jwt()->>'sub' = user_id)
   ```
6. Натисніть **"Save"**

**Примітка:** Для початку можна тимчасово вимкнути RLS (для тестування), але для продакшну потрібно включити.

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 6: Встановлення залежностей

У проєкті потрібно встановити Supabase клієнт:

```bash
npm install @supabase/supabase-js
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 7: Створення конфігурації

Створіть файл `.env.local` в корені проєкту (поряд з `package.json`):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**ВАЖЛИВО:** 
- Замініть `xxxxx` на ваш реальний Project URL
- Замініть `eyJhbGc...` на ваш реальний anon public key
- Не комітьте `.env.local` в git! Він вже має бути в `.gitignore` (через `*.local`)

**Приклад:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMDU2NzI4OSwiZXhwIjoxOTQ2MTQzMjg5fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 8: Створення прикладу конфігурації

Створіть файл `.env.example` в корені проєкту (це приклад для інших розробників):

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Цей файл можна комітити в git (без реальних ключів).

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Наступні кроки (після налаштування)

Після виконання всіх кроків, я допоможу вам:

1. ✅ Створити Supabase клієнт (`src/lib/supabase.ts`)
2. ✅ Оновити `src/state/persistence.ts` для використання Supabase
3. ✅ Налаштувати автентифікацію (якщо потрібно)
4. ✅ Міграцію даних з localStorage (якщо потрібно)
5. ✅ Тестування інтеграції

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Корисні посилання

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 💡 Важливі нотатки

1. **Database Password:** Запишіть його в безпечне місце - він потрібен для підключення до БД
2. **API Keys:** `anon` ключ можна використовувати в клієнті, але `service_role` - ТІЛЬКИ на backend!
3. **RLS (Row Level Security):** Для продакшну ОБОВ'ЯЗКОВО налаштуйте RLS для безпеки
4. **Free Plan:** Має достатньо ресурсів для початку (500MB база даних, 2GB bandwidth)
5. **Backup:** Supabase автоматично робить backup, але для важливих даних робіть свої backup
