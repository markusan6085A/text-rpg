#!/bin/bash
# Швидкий деплой на VPS без питань. Запуск на VPS: bash deploy-vps-quick.sh
# Передумова: скрипт запускати з /opt/text-rpg/server (або змінити PROJECT_ROOT нижче)

set -e

PROJECT_ROOT="${PROJECT_ROOT:-/opt/text-rpg}"

echo "📥 git pull..."
cd "$PROJECT_ROOT"
git pull

echo "📦 server: npm ci, prisma, build..."
cd "$PROJECT_ROOT/server"
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run build

if [ ! -f "dist/index.js" ]; then
    echo "❌ dist/index.js не знайдено"
    exit 1
fi

echo "🔄 PM2 restart..."
pm2 restart text-rpg-api 2>/dev/null || pm2 start dist/index.js --name text-rpg-api
pm2 save

echo "✅ Done. Status:"
pm2 status text-rpg-api
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/health && echo " health OK" || echo " health FAIL"
