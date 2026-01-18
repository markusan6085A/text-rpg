import { PrismaClient } from "@prisma/client";

// Singleton pattern for PrismaClient to avoid "max clients reached" errors
// In development, reuse the same instance across hot reloads
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Handle Prisma connection errors gracefully
prisma.$connect().catch((err) => {
  console.error('Failed to connect to database:', err);
  // Don't exit - let the server start and handle DB errors in routes
});
