/**
 * PM2: один раз на VPS (з каталогу репо):
 *   pm2 start scripts/pm2.ecosystem.cjs
 *   pm2 save
 *   pm2 startup   # щоб після reboot піднявся
 *
 * Змінні (DATABASE_URL, JWT_SECRET, …) задай через systemd EnvironmentFile
 * або експорт у shell перед pm2 — у коді сервера немає dotenv.
 */
const path = require("path");
const root = path.resolve(__dirname, "..");

module.exports = {
  apps: [
    {
      name: "text-rpg-api",
      cwd: path.join(root, "server"),
      script: "dist/index.js",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || "3000",
      },
    },
  ],
};
