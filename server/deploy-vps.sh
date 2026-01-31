#!/bin/bash

# 🚀 Скрипт для швидкого деплою на VPS
# Використання: ./deploy-vps.sh

set -e  # Зупинити виконання при помилці

# Кольори для виводу
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Початок деплою на VPS...${NC}"

# КРОК 2: Забрати зміни з GitHub
echo -e "${GREEN}📥 КРОК 2: Оновлення коду з GitHub...${NC}"
cd /opt/text-rpg
git pull

echo -e "${GREEN}✅ Останній коміт:${NC}"
git log -1 --oneline

# КРОК 3: Перезібрати backend (автоматично міграції)
echo -e "${GREEN}📦 КРОК 3: Перезібірка backend...${NC}"
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

# КРОК 4: Тимчасово перевірити (опціонально)
echo -e "${YELLOW}🧪 КРОК 4: Тимчасовий запуск для перевірки...${NC}"
echo -e "${YELLOW}Запускаю node dist/index.js (натисніть Ctrl+C після перевірки)...${NC}"
echo -e "${YELLOW}Або в іншому терміналі виконайте: curl -i http://127.0.0.1:3000/health${NC}"
read -p "Натисніть Enter для продовження (або Ctrl+C для виходу)..."

# КРОК 5: Запуск через PM2
echo -e "${GREEN}🔄 КРОК 5: Запуск через PM2...${NC}"

cd /opt/text-rpg/server

# Зупинити старий процес (якщо існує)
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

# Фінальна перевірка
echo -e "${GREEN}✅ Деплой завершено!${NC}"
echo ""
echo -e "${GREEN}📊 Статус PM2:${NC}"
pm2 status

echo ""
echo -e "${GREEN}📝 Останні 80 рядків логів:${NC}"
pm2 logs text-rpg-api --lines 80 --nostream

echo ""
echo -e "${GREEN}🧪 Health check:${NC}"
curl -i http://127.0.0.1:3000/health || echo -e "${RED}❌ Health check не пройдено${NC}"

echo ""
echo -e "${GREEN}🎉 Готово!${NC}"
