import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { MlClient } from '../../../integrations/mercadolibre/ml.client';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../../domain/products/repositories/product.repository';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { SyncLocalStockToMlUseCase } from './sync-local-stock-to-ml.usecase';

export interface VariantMapping {
  localVariantId: string;
  mlVariationId?: string | null;
}

export interface LinkProductToMlCommand {
  productId: string;
  mlItemId: string;
  variantMappings: VariantMapping[];
}

@Injectable()
export class LinkProductToMlUseCase {
  private readonly logger = new Logger(LinkProductToMlUseCase.name);

  constructor(
    private readonly mlClient: MlClient,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    private readonly prisma: PrismaService,
    private readonly syncLocalStock: SyncLocalStockToMlUseCase,
  ) {}

  async execute(cmd: LinkProductToMlCommand): Promise<void> {
    const product = await this.productRepo.findById(cmd.productId);
    if (!product) throw new NotFoundException(`Product ${cmd.productId} not found`);

    const mlItem = await this.mlClient.getItemDetail(cmd.mlItemId);

    product.assignMlItemId(cmd.mlItemId);
    const images = mlItem.pictures?.map(p => p.secure_url).filter(Boolean) ?? [];
    if (images.length) product.setImages(images);
    await this.productRepo.update(product);

    // Build map pictureId → secure_url para resolver imágenes por variante
    const pictureMap = new Map<string, string>(
      (mlItem.pictures ?? [])
        .filter(p => p.id && p.secure_url)
        .map(p => [p.id, p.secure_url]),
    );

    const listing = await this.prisma.mlListing.upsert({
      where: { mlItemId: cmd.mlItemId },
      create: { productId: cmd.productId, mlItemId: cmd.mlItemId },
      update: { productId: cmd.productId },
    });

    for (const mapping of cmd.variantMappings) {
      const variation = mlItem.variations?.find(v => String(v.id) === String(mapping.mlVariationId));
      const variantImages = variation?.picture_ids?.length
        ? variation.picture_ids.map(id => pictureMap.get(id)).filter(Boolean) as string[]
        : [];

       await this.prisma.productVariant.update({
        where: { id: mapping.localVariantId },
        data: { mlVariationId: mapping.mlVariationId ?? null, images: variantImages },
      });

      await this.prisma.mlListingVariant.upsert({
        where: { listingId_variantId: { listingId: listing.id, variantId: mapping.localVariantId } },
        create: {
          listingId: listing.id,
          variantId: mapping.localVariantId,
          mlVariationId: mapping.mlVariationId ?? null,
        },
        update: { mlVariationId: mapping.mlVariationId ?? null },
      });

    }

    for (const mapping of cmd.variantMappings) {
      await this.syncLocalStock.execute(mapping.localVariantId);
    }

    this.logger.log(`Product ${cmd.productId} linked to ML item ${cmd.mlItemId}`);
  }
}
