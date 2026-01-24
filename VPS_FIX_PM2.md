# 🔧 Виправлення: PM2 не встановлено

## Проблема
```
Command 'pm2' not found
```

## Рішення

### Крок 1: Встановити PM2 глобально

```bash
npm i -g pm2
```

### Крок 2: Перевірити встановлення

```bash
pm2 --version
```

### Крок 3: Запустити сервер

```bash
cd /opt/text-rpg/server
pm2 start dist/index.js --name text-rpg-api
pm2 save
pm2 startup
```

**Команду, яку покаже `pm2 startup`, виконай 1 раз (зазвичай з sudo).**

### Крок 4: Перевірити статус

```bash
pm2 status
pm2 logs text-rpg-api --lines 50
```

### Крок 5: Health check

```bash
curl -i http://127.0.0.1:3000/health
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Повна послідовність команд

```bash
# Встановити PM2
npm i -g pm2

# Перевірити
pm2 --version

# Запустити сервер
cd /opt/text-rpg/server
pm2 start dist/index.js --name text-rpg-api
pm2 save

# Налаштувати автозапуск
pm2 startup
# Виконати команду, яку покаже PM2

# Перевірити
pm2 status
pm2 logs text-rpg-api --lines 50
curl -i http://127.0.0.1:3000/health
```
