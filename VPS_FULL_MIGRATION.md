# 🚀 Повний перехід з Railway на VPS

## План міграції:

1. ✅ Backend працює на VPS (вже зроблено)
2. ⏳ Налаштувати Nginx (reverse proxy)
3. ⏳ Налаштувати SSL/HTTPS (Let's Encrypt)
4. ⏳ Налаштувати Frontend (на VPS або залишити на Vercel)
5. ⏳ Оновити API URL у frontend
6. ⏳ Фінальна перевірка

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 1: Налаштування Nginx (Reverse Proxy)

### 1.1. Встановити Nginx (якщо ще не встановлено):

```bash
sudo apt update
sudo apt install -y nginx
```

### 1.2. Створити конфігурацію для text-rpg:

```bash
sudo nano /etc/nginx/sites-available/text-rpg
```

**Вставити наступну конфігурацію:**

```nginx
server {
    listen 80;
    server_name 116.203.243.128;  # Ваш IP або домен

    # Логування
    access_log /var/log/nginx/text-rpg-access.log;
    error_log /var/log/nginx/text-rpg-error.log;

    # Максимальний розмір завантаження
    client_max_body_size 10M;

    # Проксування на Node.js сервер (порт 3000)
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
        
        # Таймаути
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

**Зберегти:** `Ctrl+O`, `Enter`, `Ctrl+X`

### 1.3. Активувати конфігурацію:

```bash
# Створити символічне посилання
sudo ln -s /etc/nginx/sites-available/text-rpg /etc/nginx/sites-enabled/

# Видалити дефолтну конфігурацію (якщо не потрібна)
sudo rm /etc/nginx/sites-enabled/default

# Перевірити конфігурацію nginx
sudo nginx -t

# Якщо все ОК, перезавантажити nginx
sudo systemctl reload nginx

# Додати в автозапуск
sudo systemctl enable nginx
```

### 1.4. Перевірка:

```bash
# Перевірити статус nginx
sudo systemctl status nginx

# Перевірити, що nginx слухає порт 80
sudo netstat -tlnp | grep :80

# Тест з браузера або curl
curl -i http://116.203.243.128/health
```

**Очікуваний результат:** `HTTP/1.1 200 OK` з `{"status":"ok"}`

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 2: Налаштування SSL/HTTPS (Let's Encrypt)

### 2.1. Встановити Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2.2. Отримати SSL сертифікат:

**Якщо у вас є домен:**
```bash
# Замініть example.com на ваш домен
sudo certbot --nginx -d example.com
```

**Якщо у вас тільки IP (без домену):**
- Let's Encrypt не підтримує IP адреси
- Можна використати самопідписаний сертифікат (не рекомендується для продакшн)
- Або використати Cloudflare Tunnel (безкоштовно)

### 2.3. Автоматичне оновлення сертифікату:

Certbot автоматично налаштує cron job для оновлення сертифікату.

Перевірити:
```bash
sudo certbot renew --dry-run
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 3: Налаштування Frontend

### Варіант A: Frontend на VPS (разом з backend)

#### 3.1. Зібрати frontend:

```bash
cd /opt/text-rpg

# Встановити залежності (якщо ще не встановлено)
npm install

# Зібрати frontend
npm run build
```

#### 3.2. Налаштувати Nginx для статичних файлів:

Відредагувати `/etc/nginx/sites-available/text-rpg`:

```nginx
server {
    listen 80;
    server_name 116.203.243.128;

    # Корінь для статичних файлів frontend
    root /opt/text-rpg/dist;
    index index.html;

    # Статичні файли (JS, CSS, images)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API проксування на backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

**Перезавантажити nginx:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### 3.3. Оновити API URL у frontend:

Відредагувати `.env` або змінні оточення:

```bash
cd /opt/text-rpg
nano .env
```

Додати:
```
VITE_API_URL=http://116.203.243.128
```

Перезібрати frontend:
```bash
npm run build
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### Варіант B: Frontend на Vercel (рекомендовано)

Якщо frontend вже на Vercel, просто оновити API URL:

1. **Vercel Dashboard** → **Project Settings** → **Environment Variables**
2. Оновити `VITE_API_URL` на `http://116.203.243.128` (або `https://` якщо є SSL)
3. **Redeploy** проект

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 4: Оновлення Environment Variables

### 4.1. Перевірити `.env` на VPS:

```bash
cd /opt/text-rpg/server
cat .env
```

Має бути:
```
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://game:change_me_strong@127.0.0.1:5432/game?schema=public"
JWT_SECRET="ваш_секретний_ключ"
```

### 4.2. Якщо потрібно оновити API URL у frontend:

**На VPS (якщо frontend тут):**
```bash
cd /opt/text-rpg
echo 'VITE_API_URL=http://116.203.243.128' > .env
npm run build
```

**На Vercel:**
- Оновити через Dashboard (див. Крок 3, Варіант B)

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 5: Фінальна перевірка

### 5.1. Перевірити backend:

```bash
# Health check через Nginx
curl -i http://116.203.243.128/health

# Health check напряму (має працювати)
curl -i http://127.0.0.1:3000/health
```

### 5.2. Перевірити frontend:

```bash
# Якщо frontend на VPS
curl -i http://116.203.243.128/

# Має повернути HTML з index.html
```

### 5.3. Перевірити логи:

```bash
# Nginx логи
sudo tail -f /var/log/nginx/text-rpg-access.log
sudo tail -f /var/log/nginx/text-rpg-error.log

# PM2 логи
pm2 logs text-rpg-api --lines 50
```

### 5.4. Перевірити статус сервісів:

```bash
# PM2
pm2 status

# Nginx
sudo systemctl status nginx

# Docker (база даних)
docker ps
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Крок 6: Закрити порт 3000 (безпека)

Після налаштування Nginx, закрити порт 3000 від зовнішнього доступу:

```bash
# Закрити порт 3000
sudo ufw delete allow 3000/tcp

# Перевірити правила
sudo ufw status
```

Тепер доступ тільки через Nginx (порт 80/443).

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Проблеми та рішення

### Nginx не запускається:

```bash
# Перевірити конфігурацію
sudo nginx -t

# Перевірити логи
sudo tail -f /var/log/nginx/error.log

# Перезапустити
sudo systemctl restart nginx
```

### 502 Bad Gateway:

- Перевірити, що backend працює: `pm2 status`
- Перевірити, що backend слухає на `localhost:3000`: `curl http://127.0.0.1:3000/health`

### Frontend не завантажується:

- Перевірити, що файли в `/opt/text-rpg/dist` існують
- Перевірити права доступу: `ls -la /opt/text-rpg/dist`
- Перевірити Nginx конфігурацію: `sudo nginx -t`

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Готово! 🎉

Після виконання всіх кроків:
- ✅ Backend працює на VPS
- ✅ Nginx проксує запити
- ✅ SSL налаштовано (якщо є домен)
- ✅ Frontend працює (на VPS або Vercel)
- ✅ Все доступне через HTTP/HTTPS

**Можна вимкнути Railway!** 🚂➡️🖥️
