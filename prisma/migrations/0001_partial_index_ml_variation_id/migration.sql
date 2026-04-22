-- Partial unique index on mlVariationId — only indexes non-null values.
-- Allows multiple variants without ML mapping while guaranteeing no two
-- variants share the same ml_variation_id once assigned.
CREATE UNIQUE INDEX "unique_ml_variation_id"
  ON "product_variants" ("mlVariationId")
  WHERE "mlVariationId" IS NOT NULL;
