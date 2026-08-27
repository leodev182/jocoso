-- CreateEnum
CREATE TYPE "ConcursoEstado" AS ENUM ('DRAFT', 'ACTIVE', 'FINISHED');

-- CreateTable
CREATE TABLE "concursos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "estado" "ConcursoEstado" NOT NULL DEFAULT 'DRAFT',
    "montoMinimo" DECIMAL(10,2) NOT NULL,
    "fechaDesde" TIMESTAMP(3) NOT NULL,
    "fechaHasta" TIMESTAMP(3),
    "reglas" TEXT NOT NULL,
    "legal" TEXT NOT NULL,
    "imagenPromoUrl" TEXT,
    "imagenPromoActiva" BOOLEAN NOT NULL DEFAULT false,
    "resultadoVisible" BOOLEAN NOT NULL DEFAULT false,
    "ganadorOrdenId" TEXT,
    "permiteMultiplesParticipaciones" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participaciones" (
    "id" TEXT NOT NULL,
    "concursoId" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "concursos_estado_idx" ON "concursos"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "participaciones_concursoId_ordenId_key" ON "participaciones"("concursoId", "ordenId");

-- CreateIndex
CREATE INDEX "participaciones_concursoId_idx" ON "participaciones"("concursoId");

-- CreateIndex
CREATE INDEX "participaciones_usuarioId_idx" ON "participaciones"("usuarioId");

-- AddForeignKey
ALTER TABLE "concursos" ADD CONSTRAINT "concursos_ganadorOrdenId_fkey" FOREIGN KEY ("ganadorOrdenId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participaciones" ADD CONSTRAINT "participaciones_concursoId_fkey" FOREIGN KEY ("concursoId") REFERENCES "concursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participaciones" ADD CONSTRAINT "participaciones_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participaciones" ADD CONSTRAINT "participaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
