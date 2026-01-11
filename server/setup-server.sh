#!/bin/bash
# Автоматичне налаштування production сервера
# Використання: bash setup-server.sh

set -e

echo "🚀 Початок налаштування production сервера..."

# Оновити систему
echo "📦 Оновлення системи..."
apt update && apt upgrade -y

# Встановити Node.js 20
echo "📦 Встановлення Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Встановити Nginx
echo "📦 Встановлення Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Встановити PM2
echo "📦 Встановлення PM2..."
npm install -g pm2

# Встановити Git
echo "📦 Встановлення Git..."
apt install -y git

# Встановити UFW
echo "📦 Встановлення UFW..."
apt install -y ufw
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Встановити Certbot
echo "📦 Встановлення Certbot..."
apt install -y certbot python3-certbot-nginx

echo "✅ Базова налаштування завершена!"
echo ""
echo "📝 Наступні кроки:"
echo "1. Клонувати репозиторій: git clone https://github.com/ваш-username/text-rpg.git"
echo "2. Створити .env файл в server/.env з DATABASE_URL та JWT_SECRET"
echo "3. Встановити залежності: cd server && npm install"
echo "4. Збудувати: npm run build"
echo "5. Запустити через PM2: pm2 start dist/index.js --name text-rpg-api"
echo "6. Налаштувати PM2 startup: pm2 startup systemd"
echo "7. Налаштувати Nginx (див. PRODUCTION_SERVER_SETUP.md)"
echo "8. Встановити SSL: certbot --nginx -d ваш-домен.com"
