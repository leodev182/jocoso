CREATE UNIQUE INDEX "unique_ml_variation_id"
  ON "product_variants" ("mlVariationId")
  WHERE "mlVariationId" IS NOT NULL;

CREATE UNIQUE INDEX "unique_ml_item_id"
  ON "products" ("mlItemId")
  WHERE "mlItemId" IS NOT NULL;
