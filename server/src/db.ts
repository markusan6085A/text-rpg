import { PrismaClient } from "@prisma/client";

// Singleton pattern for PrismaClient to avoid "max clients reached" errors
// In development, reuse the same instance across hot reloads
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// ❗ ВАЖЛИВО: Connection Pooling для Supabase (Supavisor / pooler, порт 6543)
// Для 50+ одночасних гравців використовуйте pooler, не direct connection (5432)
// https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || '';
  if (!url) return url;

  // Попередження: direct connection (5432) не масштабується — використовуйте pooler (6543)
  if (
    (url.includes('supabase.co') || url.includes('supabase.com')) &&
    (url.includes(':5432/') || url.match(/\.co:5432\b/))
  ) {
    console.warn(
      '[db] DATABASE_URL uses direct connection (port 5432). For 50+ concurrent players, use Supavisor/pooler (port 6543): ' +
        'postgresql://...@aws-0-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true'
    );
  }

  // Якщо це Supabase pooler (pooler.supabase / Supavisor) і не містить connection_limit, додаємо
  const isPooler =
    url.includes('.pooler.supabase.') ||
    url.includes('pooler.supabase.com') ||
    url.includes('pooler.supabase.co');
  if (isPooler && !url.includes('connection_limit')) {
    const separator = url.includes('?') ? '&' : '?';
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
