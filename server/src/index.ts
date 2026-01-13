import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "./db";
import { authRoutes } from "./auth";
import { characterRoutes } from "./characters";
import { chatRoutes } from "./chat";

const app = Fastify({ logger: true });

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
        getChatMessages: "GET /chat/messages?channel=general&page=1 (Bearer)",
        postChatMessage: "POST /chat/messages (Bearer)",
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

// CORS allowlist - add your Vercel domains here
const allowlist = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://text-pkomkw9vm-markusan6085as-projects.vercel.app",
  "https://text-rpg-git-2025-12-23-zsq5-markusan6085as-projects.vercel.app",
  // Add production domain if you have one
  // "https://text-rpg.vercel.app",
];

// Graceful shutdown
const start = async () => {
  try {
    // Register CORS
    await app.register(cors, {
      origin: (origin, callback) => {
        // Allow requests without origin (curl, healthchecks, etc.)
        if (!origin) {
          callback(null, true);
          return;
        }
        // Check if origin is in allowlist
        if (allowlist.includes(origin)) {
          callback(null, true);
          return;
        }
        // Allow all *.vercel.app domains (for preview deployments)
        if (origin.match(/^https:\/\/.*\.vercel\.app$/)) {
          callback(null, true);
          return;
        }
        // Reject all other origins
        callback(new Error("Not allowed by CORS"), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Register routes
    await app.register(authRoutes);
    await app.register(characterRoutes);
    await app.register(chatRoutes);

    const port = Number(process.env.PORT || 3000);
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`Server started on http://0.0.0.0:${port}`);
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
