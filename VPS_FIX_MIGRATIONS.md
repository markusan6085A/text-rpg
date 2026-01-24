# 🔧 Виправлення: Таблиця ChatMessage не існує

## Проблема
```
The table `public.ChatMessage` does not exist in the current database.
```

## Рішення

### Крок 1: Перевірити міграції

```bash
cd /opt/text-rpg/server
npm run prisma:migrate:deploy
```

### Крок 2: Якщо міграції вже виконані, перевірити схему

```bash
# Перевірити чи всі таблиці існують
cd /opt/text-rpg/server
npx prisma db pull
```

### Крок 3: Якщо потрібно, створити міграції заново

```bash
cd /opt/text-rpg/server
npm run prisma:migrate:deploy
```

### Крок 4: Перезапустити сервер

```bash
pm2 restart text-rpg-api
pm2 logs text-rpg-api --lines 50
```

### Крок 5: Перевірити health endpoint

```bash
curl -i http://127.0.0.1:3000/health
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Повна послідовність команд

```bash
# 1. Перейти в директорію server
cd /opt/text-rpg/server

# 2. Запустити міграції
npm run prisma:migrate:deploy

# 3. Перезапустити сервер
pm2 restart text-rpg-api

# 4. Перевірити логи
pm2 logs text-rpg-api --lines 50

# 5. Health check
curl -i http://127.0.0.1:3000/health
```
