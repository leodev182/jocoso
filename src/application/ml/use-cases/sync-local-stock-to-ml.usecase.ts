import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { MlClient } from '../../../integrations/mercadolibre/ml.client';

@Injectable()
export class SyncLocalStockToMlUseCase {
  private readonly logger = new Logger(SyncLocalStockToMlUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mlClient: MlClient,
  ) {}

  async execute(variantId: string): Promise<void> {
    const mappings = await this.prisma.mlListingVariant.findMany({
      where: { variantId },
      include: {
        listing: true,
        variant: { select: { stock: true } },
      },
    });

    await Promise.all(mappings.map((mapping) => this.push(mapping.listing.mlItemId, mapping.mlVariationId, mapping.variant.stock, variantId)));
  }

  async executeListing(mlItemId: string): Promise<void> {
    const mappings = await this.prisma.mlListingVariant.findMany({
      where: { listing: { mlItemId } },
      include: {
        listing: true,
        variant: { select: { id: true, stock: true } },
      },
    });

    await Promise.all(mappings.map((mapping) => this.push(mlItemId, mapping.mlVariationId, mapping.variant.stock, mapping.variant.id)));
  }

  private async push(mlItemId: string, mlVariationId: string | null, stock: number, variantId: string): Promise<void> {
    await this.mlClient.updateItemStock(mlItemId, mlVariationId, stock);
    this.logger.log(`Local stock synced: variant=${variantId} listing=${mlItemId} qty=${stock}`);
  }
}
