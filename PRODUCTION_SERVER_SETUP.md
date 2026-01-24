# 🚀 Налаштування Production сервера

## Варіанти серверів (рекомендації):

### 1. **DigitalOcean Droplet** ⭐ Рекомендовано
- **Ціна:** $6-12/місяць
- **RAM:** 1-2 GB
- **CPU:** 1-2 vCPU
- **Плюси:** Стабільний, простий, добра документація
- **Посилання:** https://digitalocean.com

### 2. **Hetzner Cloud**
- **Ціна:** €4-10/місяць
- **RAM:** 2-4 GB
- **CPU:** 1-2 vCPU
- **Плюси:** Дешевше, швидкий, хороша продуктивність
- **Посилання:** https://hetzner.com/cloud

### 3. **Linode**
- **Ціна:** $5-10/місяць
- **Плюси:** Надійний, хороша підтримка
- **Посилання:** https://linode.com

### 4. **Railway/Render Pro** (простіше, але дорожче)
- **Ціна:** $20+/місяць
- **Плюси:** Автоматичний деплой, без налаштування
- **Мінуси:** Дорожче за VPS

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Варіант 1: DigitalOcean VPS (Детальний гайд)

### Крок 1: Створити Droplet

1. Зареєструватися на https://digitalocean.com
2. Натиснути **"Create"** → **"Droplets"**
3. Налаштування:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic ($6/міс - 1GB RAM, або $12/міс - 2GB RAM)
   - **Region:** Вибрати найближчий (Frankfurt, Amsterdam)
   - **Authentication:** SSH keys (рекомендовано) або Password
   - **Hostname:** `text-rpg-server`
4. Натиснути **"Create Droplet"**

### Крок 2: Підключитися до сервера

```bash
# З вашого комп'ютера
ssh root@ваш-ip-адрес

# Або якщо використовуєте SSH ключ
ssh -i ~/.ssh/ваш-ключ root@ваш-ip-адрес
```

### Крок 3: Оновити систему

```bash
apt update && apt upgrade -y
```

### Крок 4: Встановити Node.js 20 LTS

```bash
# Встановити Node.js через NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Перевірити версії
node --version  # Має бути v20.x.x
npm --version
```

### Крок 5: Встановити PostgreSQL (опціонально, якщо не використовуєте Supabase)

```bash
# Якщо хочете власну базу даних (але ми використовуємо Supabase, тому це не потрібно)
# apt install -y postgresql postgresql-contrib
```

**Примітка:** Якщо використовуєте Supabase (як зараз), цей крок можна пропустити.

### Крок 6: Встановити Nginx (reverse proxy)

```bash
apt install -y nginx

# Запустити Nginx
systemctl start nginx
systemctl enable nginx

# Перевірити статус
systemctl status nginx
```

### Крок 7: Встановити PM2 (process manager для Node.js)

```bash
npm install -g pm2

# Налаштувати PM2 для автозапуску
pm2 startup systemd
# Виконати команду, яку PM2 покаже (типу: sudo env PATH=... pm2 startup systemd -u root --hp /root)
```

### Крок 8: Клонувати репозиторій

```bash
# Встановити Git (якщо ще немає)
apt install -y git

# Клонувати репозиторій
cd /opt
git clone https://github.com/ваш-username/text-rpg.git
cd text-rpg/server
```

### Крок 9: Налаштувати Environment Variables

```bash
# Створити .env файл
nano .env
```

Вставити:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[SUPABASE-HOST]:5432/postgres
JWT_SECRET=ваш-довгий-секретний-ключ-мінімум-32-символи
PORT=3000
NODE_ENV=production
```

Зберегти (Ctrl+O, Enter, Ctrl+X)

### Крок 10: Встановити залежності та збудувати

```bash
cd /opt/text-rpg/server

# Встановити залежності
npm install

# Згенерувати Prisma Client
npm run prisma:generate

# Збудувати TypeScript
npm run build
```

### Крок 11: Запустити через PM2

```bash
# Запустити сервер
pm2 start dist/index.js --name text-rpg-api

# Зберегти конфігурацію PM2
pm2 save

# Перевірити статус
pm2 status
pm2 logs text-rpg-api
```

### Крок 12: Налаштувати Nginx (reverse proxy)

```bash
# Створити конфіг для Nginx
nano /etc/nginx/sites-available/text-rpg-api
```

Вставити:
```nginx
server {
    listen 80;
    server_name ваш-домен.com api.ваш-домен.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Зберегти та активувати:
```bash
# Створити симлінк
ln -s /etc/nginx/sites-available/text-rpg-api /etc/nginx/sites-enabled/

# Перевірити конфіг
nginx -t

# Перезавантажити Nginx
systemctl reload nginx
```

### Крок 13: Встановити SSL сертифікат (Let's Encrypt)

```bash
# Встановити Certbot
apt install -y certbot python3-certbot-nginx

# Отримати сертифікат (замінити на ваш домен)
certbot --nginx -d ваш-домен.com -d api.ваш-домен.com

# Автоматичне оновлення
certbot renew --dry-run
```

### Крок 14: Налаштувати Firewall

```bash
# Встановити UFW (якщо ще немає)
apt install -y ufw

# Дозволити SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Увімкнути firewall
ufw enable

# Перевірити статус
ufw status
```

### Крок 15: Оновити CORS на backend (якщо потрібно)

Оновити `server/src/index.ts`:
```typescript
await app.register(cors, {
  origin: [
    'http://localhost:5173',
    'https://ваш-frontend-домен.vercel.app',
    'https://ваш-frontend-домен.com',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Варіант 2: Docker на VPS (Простіше управління)

### Створити Dockerfile для backend

Створити `server/Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Копіювати package files
COPY package*.json ./
COPY prisma ./prisma/

# Встановити залежності
RUN npm ci --only=production

# Згенерувати Prisma Client
RUN npx prisma generate

# Копіювати код
COPY . .

# Збудувати TypeScript
RUN npm run build

# Відкрити порт
EXPOSE 3000

# Запустити
CMD ["node", "dist/index.js"]
```

### Створити docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: ./server
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### Запуск через Docker

```bash
# Встановити Docker на сервер
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Встановити Docker Compose
apt install -y docker-compose

# Клонувати репозиторій
cd /opt
git clone https://github.com/ваш-username/text-rpg.git
cd text-rpg

# Створити .env
nano server/.env  # (додати DATABASE_URL, JWT_SECRET)

# Запустити
docker-compose up -d

# Перевірити логи
docker-compose logs -f
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Моніторинг та обслуговування

### PM2 Monitoring

```bash
# Статус
pm2 status

# Логи в реальному часі
pm2 logs text-rpg-api

# Перезапуск
pm2 restart text-rpg-api

# Статистика
pm2 monit
```

### Оновлення коду

```bash
cd /opt/text-rpg/server
git pull
npm install
npm run prisma:generate
npm run build
pm2 restart text-rpg-api
```

### Backup бази даних (якщо використовуєте власну PostgreSQL)

```bash
# Створити backup скрипт
nano /opt/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U postgres textrpg > /opt/backups/db_$DATE.sql
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Рекомендації для "суперового" сервера:

1. **Мінімальні вимоги:**
   - 1-2 GB RAM
   - 1-2 vCPU
   - 25 GB SSD

2. **Рекомендовані налаштування:**
   - Ubuntu 22.04 LTS
   - Node.js 20 LTS
   - PM2 для process management
   - Nginx як reverse proxy
   - SSL сертифікат (Let's Encrypt)

3. **Оптимізація:**
   - Використовувати PM2 cluster mode (якщо багато трафіку)
   - Налаштувати Nginx caching (для статики)
   - Використовувати CDN для frontend (Vercel/Netlify)

4. **Безпека:**
   - Firewall (UFW)
   - SSL сертифікат
   - Регулярні оновлення системи
   - SSH ключі замість паролів

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Порівняння варіантів:

| Варіант | Ціна/міс | Складність | Продуктивність | Рекомендація |
|---------|----------|------------|----------------|--------------|
| DigitalOcean VPS | $6-12 | Середня | ⭐⭐⭐⭐⭐ | ✅ Найкраще |
| Hetzner Cloud | €4-10 | Середня | ⭐⭐⭐⭐⭐ | ✅ Дешевше |
| Railway Pro | $20+ | Низька | ⭐⭐⭐⭐ | ⚠️ Дорожче |
| Docker на VPS | $6-12 | Висока | ⭐⭐⭐⭐⭐ | ✅ Гнучкіше |

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Швидкий старт (1 команда для встановлення всього):

Я можу створити bash скрипт для автоматичного налаштування сервера. Потрібен?
