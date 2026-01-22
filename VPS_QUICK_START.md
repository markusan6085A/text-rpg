# ⚡ Швидкий старт: VPS для text-rpg

## 🎯 Мінімальний набір команд (для досвідчених)

### 1. Підключення до сервера
```bash
ssh root@YOUR_IP
```

### 2. Початкове налаштування
```bash
apt update && apt upgrade -y
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### 3. Встановлення Node.js та PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
pm2 startup
```

### 4. Встановлення nginx
```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/text-rpg
# Вставити конфігурацію з nginx-text-rpg.conf
sudo ln -s /etc/nginx/sites-available/text-rpg /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5. Клонування та деплой
```bash
cd ~
git clone https://github.com/your-username/text-rpg.git
cd text-rpg/server
npm install
npm run prisma:generate
npm run build
nano .env  # Додати DATABASE_URL, JWT_SECRET, PORT=3000
pm2 start dist/index.js --name text-rpg
pm2 save
```

### 6. SSL (якщо є домен)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 7. Firewall
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 📝 Створення .env файлу

```bash
cd ~/text-rpg/server
nano .env
```

**Вміст:**
```env
DATABASE_URL=postgresql://postgres.hstwsloooubalvpwasst:PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
PORT=3000
NODE_ENV=production
```

---

## 🔄 Оновлення проекту

```bash
cd ~/text-rpg
git pull
cd server
npm install
npm run prisma:generate
npm run build
pm2 restart text-rpg
```

**Або використати скрипт:**
```bash
cd ~/text-rpg/server
chmod +x deploy.sh
./deploy.sh
```

---

## ✅ Перевірка

```bash
# Статус PM2
pm2 status

# Логи
pm2 logs text-rpg

# Health check
curl http://localhost:3000/health

# Через браузер
http://YOUR_IP/health
```

---

**Детальний гайд:** `VPS_SETUP_GUIDE.md`
