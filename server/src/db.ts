import { PrismaClient } from "@prisma/client";

// Initialize Prisma with error handling
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// Handle Prisma connection errors gracefully
prisma.$connect().catch((err) => {
  console.error('Failed to connect to database:', err);
  // Don't exit - let the server start and handle DB errors in routes
});
