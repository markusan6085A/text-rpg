# ⚡ Швидкий деплой на VPS

## Автоматичний спосіб (рекомендовано)

```bash
# На VPS сервері
cd /opt/text-rpg
git pull
chmod +x server/vps-setup.sh
./server/vps-setup.sh
```

Скрипт автоматично виконає всі кроки.

---

## Ручний спосіб (крок за кроком)

### КРОК 0 — Оновити код на VPS

```bash
cd /opt/text-rpg
git pull
```

### КРОК 1 — Підняти PostgreSQL

```bash
cd /opt/text-rpg
docker compose up -d
docker ps
```

**Переконайся, що контейнер `db` — `Up`**

### КРОК 2 — .env для backend

```bash
# Перевірити, чи існує
ls -la /opt/text-rpg/server/.env
```

**Якщо нема — створити:**

```bash
nano /opt/text-rpg/server/.env
```

**Вставити (мінімум):**

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://game:change_me_strong@127.0.0.1:5432/game?schema=public"
JWT_SECRET="(встав сюди результат: openssl rand -hex 64)"
```

**Згенерувати секрет:**

```bash
openssl rand -hex 64
```

**Скопіювати результат і вставити в `.env` як `JWT_SECRET`**

**⚠️ ВАЖЛИВО:** Замініть `change_me_strong` на пароль з `docker-compose.yml`!

### КРОК 3 — Залежності + Prisma + міграції + build

```bash
cd /opt/text-rpg/server
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run build
```

### КРОК 4 — Пробний запуск

```bash
cd /opt/text-rpg/server
node dist/index.js
```

**У другому терміналі (або після Ctrl+C) перевірка:**

```bash
curl -i http://127.0.0.1:3000/health
```

**Якщо відповідає — супер. Зупини `Ctrl+C`.**

### КРОК 5 — Запуск через PM2

```bash
# Встановити PM2 (якщо ще не встановлено)
npm i -g pm2

# Запуск
cd /opt/text-rpg/server
pm2 start dist/index.js --name text-rpg-api
pm2 save
pm2 startup
```

**Команду, яку покаже `pm2 startup`, виконай 1 раз.**

**Перевір:**

```bash
pm2 status
pm2 logs text-rpg-api --lines 50
```

### КРОК 6 — NGINX

#### 6.1 Встановити nginx

```bash
apt install -y nginx
```

#### 6.2 Додати конфіг

```bash
# Подивитись конфіг
cat /opt/text-rpg/server/nginx-text-rpg.conf

# Застосувати
cp /opt/text-rpg/server/nginx-text-rpg.conf /etc/nginx/sites-available/text-rpg

# Відредагувати (замінити YOUR_DOMAIN_OR_IP на ваш IP або домен)
nano /etc/nginx/sites-available/text-rpg

# Активувати
ln -sf /etc/nginx/sites-available/text-rpg /etc/nginx/sites-enabled/text-rpg
rm -f /etc/nginx/sites-enabled/default

# Перевірити та перезапустити
nginx -t
systemctl restart nginx
```

#### 6.3 Firewall

```bash
# Відкрити 80/443
ufw allow 80/tcp
ufw allow 443/tcp

# Закрити порт 3000 (якщо був відкритий)
ufw delete allow 3000/tcp

# Перевірити
ufw status
```

### КРОК 7 — Перевірка з ПК

У браузері:
- `http://YOUR_IP_ADDRESS/health`
- або просто `http://YOUR_IP_ADDRESS`

---

## Фінальна перевірка

Виконай на VPS і перевір результати:

```bash
# 1. Статус контейнерів
docker ps

# 2. Статус PM2
pm2 status

# 3. Health check
curl -i http://127.0.0.1:3000/health
```

**Очікуваний результат:**

1. `docker ps` — має показати контейнер `db` зі статусом `Up`
2. `pm2 status` — має показати `text-rpg-api` зі статусом `online`
3. `curl -i http://127.0.0.1:3000/health` — має показати `HTTP/1.1 200 OK` та `{"status":"ok"}`

---

## Troubleshooting

### Проблема: контейнер db не запускається

```bash
docker compose logs db
docker compose ps
```

### Проблема: сервер не запускається

```bash
pm2 logs text-rpg-api --lines 50
cd /opt/text-rpg/server
cat .env
```

### Проблема: nginx не працює

```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/text-rpg-error.log
```

### Проблема: не можу підключитись з ПК

```bash
# Перевірити firewall
sudo ufw status

# Перевірити, чи слухає nginx
ss -lntp | grep :80
ss -lntp | grep :443
```
