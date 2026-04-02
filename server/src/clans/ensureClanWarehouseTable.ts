import type { FastifyInstance } from "fastify";
import { prisma } from "../db";

export async function ensureClanWarehouseTable(app: FastifyInstance): Promise<void> {
  app.log.info("Checking if ClanWarehouse table exists...");
  try {
    // Перевіряємо, чи існує таблиця
    await prisma.$queryRaw`SELECT 1 FROM "ClanWarehouse" LIMIT 1`;
    app.log.info("ClanWarehouse table exists");
    return;
  } catch (error: any) {
    app.log.warn({ 
      error: error.message, 
      code: error.code,
      errorName: error.name 
    }, "Error checking ClanWarehouse table");
    
    // Якщо таблиця не існує, створюємо її
    const isTableMissing = error?.message?.includes('does not exist') || 
                          error?.code === '42P01' || 
                          error?.message?.includes('ClanWarehouse') ||
                          error?.message?.includes('relation') ||
                          error?.name === 'PrismaClientKnownRequestError';
    
    if (isTableMissing) {
      app.log.warn("ClanWarehouse table does not exist, creating it...");
      try {
        // Спочатку створюємо таблицю
        app.log.info("Creating ClanWarehouse table...");
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "ClanWarehouse" (
            "id" TEXT NOT NULL,
            "clanId" TEXT NOT NULL,
            "itemId" TEXT NOT NULL,
            "qty" INTEGER NOT NULL DEFAULT 1,
            "meta" JSONB NOT NULL DEFAULT '{}',
            "depositedBy" TEXT,
            "depositedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "ClanWarehouse_pkey" PRIMARY KEY ("id")
          );
        `);
        app.log.info("ClanWarehouse table created");
        
        // Створюємо індекси
        app.log.info("Creating indexes...");
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "ClanWarehouse_clanId_idx" ON "ClanWarehouse"("clanId");
        `);
        
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "ClanWarehouse_clanId_depositedAt_idx" ON "ClanWarehouse"("clanId", "depositedAt");
        `);
        app.log.info("Indexes created");
        
        // Додаємо foreign key, якщо таблиця Clan існує
        try {
          const clanExists = await prisma.$queryRaw<Array<{exists: boolean}>>`
            SELECT EXISTS (
              SELECT 1 FROM information_schema.tables 
              WHERE table_schema = 'public' AND table_name = 'Clan'
            ) as exists;
          `;
          
          if (clanExists[0]?.exists) {
            app.log.info("Clan table exists, adding foreign key...");
            const fkExists = await prisma.$queryRaw<Array<{exists: boolean}>>`
              SELECT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'ClanWarehouse_clanId_fkey'
              ) as exists;
            `;
            
            if (!fkExists[0]?.exists) {
              await prisma.$executeRawUnsafe(`
                ALTER TABLE "ClanWarehouse" 
                ADD CONSTRAINT "ClanWarehouse_clanId_fkey" 
                FOREIGN KEY ("clanId") REFERENCES "Clan"("id") 
                ON DELETE CASCADE ON UPDATE CASCADE;
              `);
              app.log.info("Foreign key added");
            } else {
              app.log.info("Foreign key already exists");
            }
          } else {
            app.log.warn("Clan table does not exist, skipping foreign key");
          }
        } catch (fkError: any) {
          app.log.warn({ error: fkError.message }, "Failed to add foreign key, but table was created");
        }
        
        app.log.info("ClanWarehouse table created successfully");
      } catch (createError: any) {
        app.log.error({ 
          error: createError.message, 
          code: createError.code,
          stack: createError.stack 
        }, "Failed to create ClanWarehouse table");
        throw createError; // Кидаємо помилку, щоб retry логіка могла спробувати ще раз
      }
    } else {
      app.log.error({ error: error.message, code: error.code }, "Unexpected error checking ClanWarehouse table");
      // Не кидаємо помилку, спробуємо продовжити
    }
  }
}
