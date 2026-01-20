import { PrismaClient } from "@prisma/client";

// Singleton pattern for PrismaClient to avoid "max clients reached" errors
// In development, reuse the same instance across hot reloads
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// ❗ ВАЖЛИВО: Обмежуємо connection pool для Supabase
// Supabase має обмеження на кількість одночасних з'єднань
// Використовуємо connection_limit через query parameter в DATABASE_URL
// Якщо DATABASE_URL вже містить параметри, додаємо connection_limit
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || '';
  if (!url) return url;
  
  // Якщо це Supabase pooler (містить .pooler.supabase.com або .pooler.supabase.co)
  // і не містить connection_limit, додаємо його
  if (url.includes('.pooler.supabase.') && !url.includes('connection_limit')) {
    const separator = url.includes('?') ? '&' : '?';
    // Обмежуємо до 1 з'єднання для Supabase pooler (Session mode має обмеження)
    return `${url}${separator}connection_limit=1&pool_timeout=10`;
  }
  
  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Handle Prisma connection errors gracefully
prisma.$connect().catch((err) => {
  console.error('Failed to connect to database:', err);
  // Don't exit - let the server start and handle DB errors in routes
});
