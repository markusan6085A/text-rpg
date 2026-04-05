#!/usr/bin/env bash
# Деплой text-rpg на VPS: pull → build фронту → build сервера → prisma migrate → restart PM2/systemd.
#
# Один раз на сервері:
#   chmod +x scripts/deploy-vps.sh
#   export TEXT_RPG_ROOT=/шлях/до/репо   # за замовчуванням: поточна директорія
#   export DEPLOY_BRANCH=2025-12-23-zsq5 # або main — твоя гілка
#
# Змінні в server/.env (або systemd EnvironmentFile) — ОБОВʼЯЗКОВО:
#   DATABASE_URL, DIRECT_URL (як у Prisma), JWT_SECRET, PORT=3000, тощо.
#
set -euo pipefail

ROOT="${TEXT_RPG_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
BRANCH="${DEPLOY_BRANCH:-$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)}"

cd "$ROOT"
echo "==> repo: $ROOT branch: $BRANCH"

git fetch origin
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git checkout "$BRANCH"
elif git show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
  git checkout -B "$BRANCH" "origin/$BRANCH"
else
  echo "Помилка: гілка origin/$BRANCH не знайдена. Перевір DEPLOY_BRANCH."
  exit 1
fi
git pull origin "$BRANCH"

echo "==> frontend (Vite → dist/)"
npm ci
npm run build

echo "==> server (build + migrate)"
cd "$ROOT/server"
npm ci
npm run build
npx prisma migrate deploy

echo "==> restart backend"
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe text-rpg-api >/dev/null 2>&1; then
    pm2 restart text-rpg-api
  else
    echo "PM2: додай процес один раз:  pm2 start $ROOT/scripts/pm2.ecosystem.cjs --only text-rpg-api"
    echo "      (або systemd — див. scripts/text-rpg-api.service.example)"
  fi
else
  echo "PM2 не встановлено. Якщо systemd:"
  echo "  sudo systemctl restart text-rpg-api"
fi

echo "==> готово. Перевір: curl -sS http://127.0.0.1:\${PORT:-3000}/health"
