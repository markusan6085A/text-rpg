-- CreateTable
CREATE TABLE "Kv" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kv_pkey" PRIMARY KEY ("key")
);
