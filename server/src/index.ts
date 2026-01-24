import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "./db";
import { authRoutes } from "./auth";
import { characterRoutes } from "./characters";
import { chatRoutes } from "./chat";
import { letterRoutes } from "./letters";
import { newsRoutes } from "./news";
import { sevenSealsRoutes } from "./sevenSeals";

const app = Fastify({ 
  logger: true,
  // 🔥 Дозволяємо DELETE без body
  bodyLimit: 1048576, // 1MB
});

// Root route
app.get("/", async () => {
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
    // Register CORS FIRST - before routes!
    // 🔒 Безпека: дозволяємо тільки домени l2dop.com
    const allowedOrigins = [
      'https://l2dop.com',
      'https://www.l2dop.com',
      'http://localhost:5173', // для локальної розробки
      'http://localhost:3000',  // для локальної розробки
    ];
    
    await app.register(cors, {
      origin: (origin, callback) => {
        // Дозволяємо запити без origin (наприклад, Postman, curl)
        if (!origin) {
          return callback(null, true);
        }
        // Перевіряємо, чи origin в списку дозволених
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        // Для production - блокуємо невідомі домени
        if (process.env.NODE_ENV === 'production') {
          app.log.warn({ origin }, 'Blocked CORS request from unauthorized origin');
          return callback(new Error('Not allowed by CORS'), false);
        }
        // Для development - дозволяємо (але логуємо)
        app.log.warn({ origin }, 'Allowing CORS from unknown origin (development mode)');
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Register routes AFTER CORS
    await app.register(authRoutes);
    await app.register(characterRoutes);
    await app.register(chatRoutes);
    await app.register(letterRoutes);
    await app.register(newsRoutes);
    await app.register(sevenSealsRoutes);

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
