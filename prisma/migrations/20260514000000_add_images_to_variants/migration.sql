-- AlterTable: agrega columna images a product_variants
-- Seguro con data existente: filas existentes quedan con array vacío por defecto
ALTER TABLE "product_variants" ADD COLUMN "images" TEXT[] NOT NULL DEFAULT '{}';
