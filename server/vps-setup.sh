#!/bin/bash

# 🚀 Скрипт для повного налаштування VPS для text-rpg
# Використання: ./vps-setup.sh

set -e  # Зупинити виконання при помилці

# Кольори для виводу
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Початок налаштування VPS для text-rpg...${NC}"

# КРОК 0 — Оновити код на VPS
echo -e "${GREEN}📥 КРОК 0: Оновлення коду з GitHub...${NC}"
cd /opt/text-rpg
git pull || echo -e "${YELLOW}⚠️ Не вдалося оновити код (може бути нормально, якщо вже актуальний)${NC}"

# КРОК 1 — Підняти PostgreSQL
echo -e "${GREEN}🗄️ КРОК 1: Запуск PostgreSQL...${NC}"
cd /opt/text-rpg
docker compose up -d
sleep 2
docker ps

echo -e "${GREEN}✅ Перевірка: контейнер db має бути зі статусом 'Up'${NC}"
if ! docker ps | grep -q "db.*Up"; then
    echo -e "${RED}❌ Помилка: контейнер db не запущено!${NC}"
    docker compose logs db
    exit 1
fi

# КРОК 2 — .env для backend
echo -e "${GREEN}⚙️ КРОК 2: Перевірка .env файлу...${NC}"
if [ ! -f "/opt/text-rpg/server/.env" ]; then
    echo -e "${YELLOW}⚠️ .env файл не знайдено, створюю...${NC}"
    
    # Генерувати JWT_SECRET
    JWT_SECRET=$(openssl rand -hex 64)
    
    cat > /opt/text-rpg/server/.env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://game:change_me_strong@127.0.0.1:5432/game?schema=public"
JWT_SECRET="$JWT_SECRET"
EOF
    
    echo -e "${GREEN}✅ .env файл створено з автоматично згенерованим JWT_SECRET${NC}"
    echo -e "${YELLOW}⚠️ ВАЖЛИВО: Перевірте пароль в DATABASE_URL (замініть change_me_strong на пароль з docker-compose.yml)${NC}"
else
    echo -e "${GREEN}✅ .env файл вже існує${NC}"
fi

# КРОК 3 — Залежності + Prisma + міграції + build
echo -e "${GREEN}📦 КРОК 3: Встановлення залежностей та збірка...${NC}"
cd /opt/text-rpg/server
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run build

if [ ! -f "dist/index.js" ]; then
    echo -e "${RED}❌ Помилка: dist/index.js не знайдено після збірки${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Збірка завершена${NC}"

# КРОК 4 — Пробний запуск (опціонально, можна пропустити)
echo -e "${GREEN}🧪 КРОК 4: Пробний запуск (натисніть Ctrl+C після перевірки)...${NC}"
echo -e "${YELLOW}Запускаю node dist/index.js...${NC}"
echo -e "${YELLOW}Після того як побачите 'Server started', натисніть Ctrl+C${NC}"
echo -e "${YELLOW}Або залиште працювати і в іншому терміналі виконайте: curl -i http://127.0.0.1:3000/health${NC}"
read -p "Натисніть Enter для продовження (або Ctrl+C для виходу)..."

# КРОК 5 — Запуск через PM2
echo -e "${GREEN}🔄 КРОК 5: Запуск через PM2...${NC}"

# Перевірити, чи встановлено PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️ PM2 не знайдено, встановлюю...${NC}"
    npm i -g pm2
fi

cd /opt/text-rpg/server

# Зупинити старий процес, якщо існує
pm2 delete text-rpg-api 2>/dev/null || true

# Запустити новий
pm2 start dist/index.js --name text-rpg-api
pm2 save

# Налаштувати автозапуск
echo -e "${GREEN}Налаштування автозапуску PM2...${NC}"
STARTUP_CMD=$(pm2 startup | grep -v "PM2" | grep "sudo")
if [ ! -z "$STARTUP_CMD" ]; then
    echo -e "${YELLOW}Виконайте цю команду:${NC}"
    echo -e "${YELLOW}$STARTUP_CMD${NC}"
    read -p "Натисніть Enter після виконання команди..."
fi

# Перевірка
echo -e "${GREEN}📊 Статус PM2:${NC}"
pm2 status

echo -e "${GREEN}📝 Останні 20 рядків логів:${NC}"
pm2 logs text-rpg-api --lines 20 --nostream

# КРОК 6 — NGINX
echo -e "${GREEN}🌐 КРОК 6: Налаштування nginx...${NC}"

# Встановити nginx, якщо не встановлено
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}⚠️ nginx не знайдено, встановлюю...${NC}"
    apt install -y nginx
fi

# Скопіювати конфігурацію
if [ -f "/opt/text-rpg/server/nginx-text-rpg.conf" ]; then
    cp /opt/text-rpg/server/nginx-text-rpg.conf /etc/nginx/sites-available/text-rpg
    
    # Замінити YOUR_DOMAIN_OR_IP на IP адресу сервера (якщо не вказано)
    SERVER_IP=$(hostname -I | awk '{print $1}')
    sed -i "s/YOUR_DOMAIN_OR_IP/$SERVER_IP/g" /etc/nginx/sites-available/text-rpg
    
    ln -sf /etc/nginx/sites-available/text-rpg /etc/nginx/sites-enabled/text-rpg
    rm -f /etc/nginx/sites-enabled/default
    
    # Перевірити конфігурацію
    if nginx -t; then
        systemctl restart nginx
        systemctl enable nginx
        echo -e "${GREEN}✅ nginx налаштовано та перезапущено${NC}"
    else
        echo -e "${RED}❌ Помилка в конфігурації nginx!${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Помилка: nginx-text-rpg.conf не знайдено!${NC}"
    exit 1
fi

# КРОК 7 — Firewall
echo -e "${GREEN}🔥 КРОК 7: Налаштування firewall...${NC}"

# Встановити UFW, якщо не встановлено
if ! command -v ufw &> /dev/null; then
    apt install -y ufw
fi

# Дозволити потрібні порти
ufw allow 22/tcp  # SSH
ufw allow 80/tcp  # HTTP
ufw allow 443/tcp # HTTPS

# Закрити порт 3000 (якщо був відкритий)
ufw delete allow 3000/tcp 2>/dev/null || true

# Увімкнути firewall (якщо ще не увімкнено)
echo "y" | ufw enable 2>/dev/null || ufw --force enable

echo -e "${GREEN}📊 Статус firewall:${NC}"
ufw status

# Фінальна перевірка
echo -e "${GREEN}✅ Налаштування завершено!${NC}"
echo -e "${GREEN}📋 Фінальна перевірка:${NC}"
echo ""
echo -e "${YELLOW}1. Статус контейнерів:${NC}"
docker ps
echo ""
echo -e "${YELLOW}2. Статус PM2:${NC}"
pm2 status
echo ""
echo -e "${YELLOW}3. Health check:${NC}"
curl -i http://127.0.0.1:3000/health || echo -e "${RED}❌ Health check не пройдено${NC}"
echo ""
echo -e "${GREEN}🎉 Готово! Тепер перевірте з вашого ПК:${NC}"
echo -e "${GREEN}http://$(hostname -I | awk '{print $1}')/health${NC}"
