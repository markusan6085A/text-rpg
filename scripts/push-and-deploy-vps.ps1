# Push to git and deploy backend on VPS
# Usage:
#   $env:VPS_HOST = "your-server.com"; $env:VPS_USER = "root"; .\scripts\push-and-deploy-vps.ps1
# Or one-liner: $env:VPS_HOST="1.2.3.4"; .\scripts\push-and-deploy-vps.ps1
#
# Optional env: VPS_HOST (required), VPS_USER (default: root), VPS_PATH (default: /opt/text-rpg)

$ErrorActionPreference = "Stop"
$hostName = $env:VPS_HOST
$userName = if ($env:VPS_USER) { $env:VPS_USER } else { "root" }
$remotePath = if ($env:VPS_PATH) { $env:VPS_PATH } else { "/opt/text-rpg" }

if (-not $hostName) {
    Write-Host "Set VPS_HOST (and optionally VPS_USER, VPS_PATH). Example:" -ForegroundColor Yellow
    Write-Host '  $env:VPS_HOST = "api.l2dop.com"; .\scripts\push-and-deploy-vps.ps1' -ForegroundColor Cyan
    exit 1
}

$sshTarget = "${userName}@${hostName}"

Write-Host "Push to git..." -ForegroundColor Green
git push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Deploy on VPS ($sshTarget)..." -ForegroundColor Green
$cmd = "cd $remotePath && git pull && cd server && npm ci && npm run prisma:generate && npm run prisma:migrate:deploy && npm run build && (pm2 restart text-rpg-api 2>/dev/null || pm2 start dist/index.js --name text-rpg-api) && pm2 save"
ssh $sshTarget $cmd
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Done. Checking health..." -ForegroundColor Green
ssh $sshTarget "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/health"
Write-Host ""
