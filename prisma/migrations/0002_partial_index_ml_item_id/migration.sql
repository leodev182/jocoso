-- Partial unique index on mlItemId — mirrors the same pattern as mlVariationId.
-- Products without ML mapping stay unindexed; uniqueness enforced only when assigned.
CREATE UNIQUE INDEX "unique_ml_item_id"
  ON "products" ("mlItemId")
  WHERE "mlItemId" IS NOT NULL;
