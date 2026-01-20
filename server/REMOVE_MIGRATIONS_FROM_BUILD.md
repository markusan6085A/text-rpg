# ⚡ Швидке виправлення: Прибрати migrations з build

## Проблема
Build падає на `prisma migrate deploy` з помилкою "Can't reach database server", хоча `DATABASE_URL` налаштовано правильно.

## ✅ Рішення

### Прибрати migrations з build команди

Якщо таблиці вже створені в БД (migrations вже виконані), просто прибрати `prisma migrate deploy` з build:

1. **Railway** → **Settings** → **Build & Deploy**
2. **Build Command** змінити з:
   ```
   npm install && npm run prisma:generate && npm run prisma:migrate:deploy && npm run build
   ```
   
   **НА:**
   ```
   npm install && npm run prisma:generate && npm run build
   ```

3. **Зберегти** - Railway автоматично перезапустить build

---

## Коли потрібні migrations?

Migrations потрібні тільки якщо:
- ❌ Таблиці ще не створені в БД (перший деплой)
- ❌ Є нові зміни в `prisma/schema.prisma` (нові поля/таблиці)

Якщо таблиці вже є і схема не змінювалася - migrations не потрібні!

---

## Перевірка після змін

Після збереження, в логах Railway має бути:
```
✔ Generated Prisma Client
✓ built in X.XXs
Server started on http://0.0.0.0:PORT
```

Без помилок про підключення до БД під час build!
