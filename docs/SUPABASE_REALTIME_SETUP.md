# Supabase Realtime для Character table

Щоб замінити polling на Realtime, потрібно:

1. **Додати змінні в `.env`:**
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

2. **Увімкнути Realtime для таблиці Character в Supabase Dashboard:**
   - Database → Replication
   - Додати таблицю `Character` до публікації `supabase_realtime`

3. **RLS (опційно):** Якщо на Character увімкнено RLS, переконайтеся, що клієнт має доступ до отримання змін для свого персонажа.
