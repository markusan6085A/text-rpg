import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import path from "path";
import { prisma } from "./db";
import { toJsonSafe } from "./utils/sanitizeBigInt";
import { authRoutes } from "./auth";
import { characterRoutes } from "./routes/character";
import { chatRoutes } from "./chat";
import { letterRoutes } from "./letters";
import { newsRoutes } from "./news";
import { sevenSealsRoutes } from "./sevenSeals";
import { clanRoutes } from "./clans";
import { forumRoutes } from "./forum";
import { leaderboardRoutes } from "./leaderboard";
import { authRefreshRoutes } from "./routes/authRefresh";
import { authLogoutRoutes } from "./routes/authLogout";
import { adminAuthRoutes } from "./routes/adminAuth";
import { adminRoutes } from "./routes/admin";
import { adminPlayersRoutes } from "./routes/adminPlayers";
import { adminExtendedRoutes } from "./routes/adminExtended";
import { adminLogsRoutes } from "./routes/adminLogs";
import { premiumRoutes } from "./routes/premium";
import { runSevenSealsMailJob } from "./sevenSealsMail";

// Отримуємо шлях до dist папки (frontend build)
// Якщо сервер запускається з server/, то process.cwd() = server/
// Шлях до dist папки frontend (з кореня проекту) = ../dist
// Якщо сервер запускається з кореня, то dist/ напряму
let distPath: string;
try {
  // Спробуємо знайти dist в корені проекту (на один рівень вище server/)
  const rootDist = path.resolve(process.cwd(), "..", "dist");
  const fs = require("fs");
  if (fs.existsSync(rootDist)) {
    distPath = rootDist;
  } else {
    // Якщо не знайдено, спробуємо в поточній директорії
    distPath = path.resolve(process.cwd(), "dist");
  }
} catch {
  // Fallback: припускаємо, що dist в корені проекту
  distPath = path.resolve(process.cwd(), "..", "dist");
}

const app = Fastify({ 
  logger: true,
  // 🔥 Дозволяємо DELETE без body
  bodyLimit: 1048576, // 1MB
});

// Глобально: BigInt → string (Prisma exp тощо). На фронті при потребі Number().
app.addHook("preSerialization", async (_request, _reply, payload) => {
  if (payload === undefined || payload === null) return payload;
  return toJsonSafe(payload);
});

// Root route - тільки для API запитів (з заголовком Accept: application/json)
// Для браузера (без Accept заголовка) буде обслуговуватися index.html через static files
app.get("/", async (request, reply) => {
  const acceptHeader = request.headers.accept || "";
  // Якщо це API запит (з JSON Accept) - повертаємо JSON
  if (acceptHeader.includes("application/json")) {
    return {
      name: "Text RPG Server",
      version: "1.0.0",
      status: "running",
      endpoints: {
        health: "GET /health",
        register: "POST /auth/register",
        login: "POST /auth/login",
        listCharacters: "GET /characters (Bearer)",
        getCharacter: "GET /characters/:id (Bearer)",
        createCharacter: "POST /characters (Bearer)",
        updateCharacter: "PUT /characters/:id (Bearer)",
        getChatMessages: "GET /chat/messages?channel=general&page=1&limit=10 (Bearer)",
        postChatMessage: "POST /chat/messages (Bearer)",
        deleteChatMessage: "DELETE /chat/messages/:id (Bearer)",
        getOnlinePlayers: "GET /characters/online (Bearer)",
        sendHeartbeat: "POST /characters/heartbeat (Bearer)",
        getPublicCharacter: "GET /characters/public/:id (Bearer)",
        getCharacterByName: "GET /characters/by-name/:name (Bearer)",
        sendLetter: "POST /letters (Bearer)",
        getLetters: "GET /letters?page=1&limit=50 (Bearer)",
        getLetter: "GET /letters/:id (Bearer)",
        deleteLetter: "DELETE /letters/:id (Bearer)",
        getUnreadCount: "GET /letters/unread-count (Bearer)",
      },
    };
  }
  // Для браузера - не обробляємо тут, буде обслуговуватися через static files або 404 handler
  return reply.code(404).send({ error: "Not found" });
});

// Health check
app.get("/health", async () => {
  return { status: "ok" };
});

// Database connection test
app.get("/test-db", async (req, reply) => {
  try {
    const count = await prisma.account.count();
    return { status: "ok", dbConnected: true, accountCount: count };
  } catch (error) {
    app.log.error(error, "Database test error:");
    return reply.code(500).send({
      status: "error",
      dbConnected: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

// Graceful shutdown
const start = async () => {
  // Retry підключення до БД (до 5 спроб, з затримкою 2 секунди)
  const maxRetries = 5;
  const retryDelay = 2000; // 2 секунди
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      app.log.info("Database connected");
      break; // Успішно підключено
    } catch (err) {
      if (attempt === maxRetries) {
        app.log.error(err, "Failed to connect to database after all retries");
        process.exit(1);
      } else {
        app.log.warn(`Database connection attempt ${attempt}/${maxRetries} failed, retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  try {
    // 🔥 Реєструємо статичні файли ПЕРЕД CORS та routes
    // Це дозволяє обслуговувати JavaScript модулі з правильними MIME types
    try {
      await app.register(fastifyStatic, {
        root: distPath,
        prefix: '/', // Обслуговуємо з кореня
        setHeaders: (res, pathName) => {
          // MIME types
          if (pathName.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          } else if (pathName.endsWith('.mjs')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          } else if (pathName.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
          }
          // Кешування статики: картинки, js, css — 1 рік
          const isStaticAsset = /\.(js|mjs|css|jpg|jpeg|png|gif|webp|svg|ico|woff|woff2)$/i.test(pathName);
          if (isStaticAsset) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            const expires = new Date();
            expires.setFullYear(expires.getFullYear() + 1);
            res.setHeader('Expires', expires.toUTCString());
          }
        },
      });
      app.log.info(`Static files registered from: ${distPath}`);
    } catch (staticError) {
      app.log.warn({ error: staticError, distPath }, 'Failed to register static files (may be normal if dist/ does not exist)');
    }

    await app.register(cookie);

    // Register CORS - before routes (credentials: true for refresh cookie)
    const allowedOrigins = [
      "https://l2dop.com",
      "https://www.l2dop.com",
      "http://localhost:5173",
      "http://localhost:3000",
    ];

    await app.register(cors, {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const isAllowedVercel = (o: string) =>
          /^https:\/\/text-.*-(l2dop|12dop)\.vercel\.app$/.test(o);

        if (allowedOrigins.includes(origin) || isAllowedVercel(origin)) {
          return callback(null, true);
        }

        if (process.env.NODE_ENV === "production") {
          app.log.warn({ origin }, "Blocked CORS request from unauthorized origin");
          return callback(new Error("Not allowed by CORS"), false);
        }

        app.log.warn({ origin }, "Allowing CORS from unknown origin (development mode)");
        return callback(null, true);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    });

    // Register routes AFTER CORS and cookie (setNotFoundHandler МАЄ бути НИЖЧЕ за всі register!)
    await app.register(authRoutes);
    await app.register(authRefreshRoutes);
    await app.register(authLogoutRoutes);

    // ✅ ADMIN — adminExtendedRoutes BEFORE adminPlayersRoutes so /admin/players and /admin/clans match correctly
    await app.register(adminRoutes, { prefix: "/admin" });
    await app.register(adminAuthRoutes, { prefix: "/admin/auth" });
    await app.register(adminExtendedRoutes, { prefix: "/admin" });
    await app.register(adminPlayersRoutes, { prefix: "/admin/player" });
    await app.register(adminLogsRoutes, { prefix: "/admin/logs" });

    await app.register(characterRoutes);
    await app.register(premiumRoutes);
    await app.register(chatRoutes);
    await app.register(letterRoutes);
    await app.register(newsRoutes);
    await app.register(sevenSealsRoutes);
    await app.register(clanRoutes);
    await app.register(forumRoutes);
    await app.register(leaderboardRoutes);

    // ✅ ТІЛЬКИ ТУТ:
    app.setNotFoundHandler(async (request, reply) => {
      // для API — 404 JSON
      if (
        request.url.startsWith("/auth") ||
        request.url.startsWith("/admin") ||
        request.url.startsWith("/characters") ||
        request.url.startsWith("/chat") ||
        request.url.startsWith("/letters") ||
        request.url.startsWith("/news") ||
        request.url.startsWith("/seven-seals") ||
        request.url.startsWith("/clans") ||
        request.url.startsWith("/forum") ||
        request.url.startsWith("/leaderboard") ||
        request.url.startsWith("/premium") ||
        request.url.startsWith("/health") ||
        request.url.startsWith("/test-db")
      ) {
        return reply.code(404).send({ error: "Not found" });
      }

      // для фронта — index.html
      return reply.sendFile("index.html");
    });

    const port = Number(process.env.PORT || 3000);
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`Server started on http://0.0.0.0:${port}`);

    // 🔥 Періодична очистка старих повідомлень чату (кожні 1 годину)
    setInterval(async () => {
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const deletedChat = await prisma.chatMessage.deleteMany({
          where: {
            createdAt: {
              lt: twentyFourHoursAgo,
            },
          },
        });
        if (deletedChat.count > 0) {
          app.log.info(`Cleaned up ${deletedChat.count} old chat messages (older than 24 hours)`);
        }
      } catch (err) {
        app.log.error(err, "Error cleaning up old chat messages:");
      }
    }, 60 * 60 * 1000); // Кожні 1 годину

    // 🔥 Періодична очистка старих листів (кожні 1 годину)
    setInterval(async () => {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const deletedLetters = await prisma.letter.deleteMany({
          where: {
            createdAt: {
              lt: thirtyDaysAgo,
            },
          },
        });
        if (deletedLetters.count > 0) {
          app.log.info(`Cleaned up ${deletedLetters.count} old letters (older than 30 days)`);
        }
      } catch (err) {
        app.log.error(err, "Error cleaning up old letters:");
      }
    }, 60 * 60 * 1000); // Кожні 1 годину

    // 🔥 Розсилка листів топ-3 переможцям 7 Печатей щосуботи 00:00 (Europe/Warsaw) від Existence
    setInterval(async () => {
      try {
        await runSevenSealsMailJob((msg, meta) => {
          if (meta) app.log.info(meta as any, msg);
          else app.log.info(msg);
        });
      } catch (err) {
        app.log.error(err, "Seven Seals mail job error:");
      }
    }, 5 * 60 * 1000); // Кожні 5 хвилин

    // Запускаємо очистку одразу при старті
    setTimeout(async () => {
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const deletedChat = await prisma.chatMessage.deleteMany({
          where: {
            createdAt: {
              lt: twentyFourHoursAgo,
            },
          },
        });
        if (deletedChat.count > 0) {
          app.log.info(`Initial cleanup: removed ${deletedChat.count} old chat messages`);
        }

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const deletedLetters = await prisma.letter.deleteMany({
          where: {
            createdAt: {
              lt: thirtyDaysAgo,
            },
          },
        });
        if (deletedLetters.count > 0) {
          app.log.info(`Initial cleanup: removed ${deletedLetters.count} old letters`);
        }
      } catch (err) {
        app.log.error(err, "Error in initial cleanup:");
      }
    }, 5000); // Через 5 секунд після старту
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// Handle shutdown
const shutdown = async () => {
  app.log.info("Shutting down gracefully...");
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
