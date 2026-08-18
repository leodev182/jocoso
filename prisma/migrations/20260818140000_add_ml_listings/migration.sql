CREATE TABLE "ml_listings" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "mlItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ml_listings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ml_listing_variants" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "mlVariationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ml_listing_variants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ml_listings_mlItemId_key" ON "ml_listings"("mlItemId");
CREATE INDEX "ml_listings_productId_idx" ON "ml_listings"("productId");
CREATE UNIQUE INDEX "ml_listing_variants_listingId_variantId_key" ON "ml_listing_variants"("listingId", "variantId");
CREATE UNIQUE INDEX "ml_listing_variants_listingId_mlVariationId_key" ON "ml_listing_variants"("listingId", "mlVariationId");
CREATE INDEX "ml_listing_variants_variantId_idx" ON "ml_listing_variants"("variantId");
CREATE INDEX "ml_listing_variants_mlVariationId_idx" ON "ml_listing_variants"("mlVariationId");

ALTER TABLE "ml_listings" ADD CONSTRAINT "ml_listings_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ml_listing_variants" ADD CONSTRAINT "ml_listing_variants_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "ml_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ml_listing_variants" ADD CONSTRAINT "ml_listing_variants_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ml_listings" ("id", "productId", "mlItemId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", "mlItemId", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "products"
WHERE "mlItemId" IS NOT NULL AND "mlItemId" <> ''
ON CONFLICT ("mlItemId") DO NOTHING;

INSERT INTO "ml_listing_variants" ("id", "listingId", "variantId", "mlVariationId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, l."id", v."id", v."mlVariationId", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "ml_listings" l
JOIN "product_variants" v ON v."productId" = l."productId"
ON CONFLICT ("listingId", "variantId") DO NOTHING;
