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

// Graceful shutdown
const start = async () => {
  try {
    // Register CORS
    await app.register(cors, {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
