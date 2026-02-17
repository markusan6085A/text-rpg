#!/bin/bash
# Push to git and deploy backend on VPS.
# Usage:
#   VPS_HOST=api.l2dop.com ./scripts/push-and-deploy-vps.sh
#   VPS_HOST=1.2.3.4 VPS_USER=root ./scripts/push-and-deploy-vps.sh
#
# Env: VPS_HOST (required), VPS_USER (default: root), VPS_PATH (default: /opt/text-rpg)

set -e
VPS_USER="${VPS_USER:-root}"
VPS_PATH="${VPS_PATH:-/opt/text-rpg}"

if [ -z "$VPS_HOST" ]; then
  echo "Set VPS_HOST. Example:"
  echo "  VPS_HOST=api.l2dop.com ./scripts/push-and-deploy-vps.sh"
  exit 1
fi

echo "Push to git..."
git push

echo "Deploy on VPS ($VPS_USER@$VPS_HOST)..."
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && bash server/deploy-vps-quick.sh"

echo "Done."
