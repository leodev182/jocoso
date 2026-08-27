-- AlterTable
ALTER TABLE "concursos" ADD COLUMN "ganadorFallbackNombre" TEXT;
ALTER TABLE "concursos" ADD COLUMN "minimoTickets" INTEGER NOT NULL DEFAULT 1;
