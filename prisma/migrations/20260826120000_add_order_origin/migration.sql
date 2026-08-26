-- CreateEnum
CREATE TYPE "OrderOrigin" AS ENUM ('WEB', 'ML', 'CARD', 'TRANSFER', 'CASH');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "origin" "OrderOrigin" NOT NULL DEFAULT 'WEB';
