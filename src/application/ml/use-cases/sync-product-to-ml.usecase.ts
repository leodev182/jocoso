import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { MlClient } from '../../../integrations/mercadolibre/ml.client';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../../domain/products/repositories/product.repository';
import { IProductVariantRepository, PRODUCT_VARIANT_REPOSITORY } from '../../../domain/products/repositories/product-variant.repository';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface SyncProductToMlCommand {
  productId: string;
  mlCategoryId: string;
  condition: 'new' | 'used';
  listingType: string;
}

@Injectable()
export class SyncProductToMlUseCase {
  private readonly logger = new Logger(SyncProductToMlUseCase.name);

  constructor(
    private readonly mlClient: MlClient,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variantRepo: IProductVariantRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(cmd: SyncProductToMlCommand): Promise<string> {
    const product = await this.productRepo.findById(cmd.productId);
    if (!product) throw new NotFoundException(`Product ${cmd.productId} not found`);

    const variants = await this.variantRepo.findByProductId(cmd.productId);
    if (!variants.length) throw new NotFoundException('Product has no variants');

    const hasVariations = variants.length > 1;

    const mlItem = {
      title: product.getTitle(),
      category_id: cmd.mlCategoryId,
      price: Number(variants[0].getPrice()),
      currency_id: 'CLP',
      available_quantity: variants[0].getStock(),
      buying_mode: 'buy_it_now',
      condition: cmd.condition,
      listing_type_id: cmd.listingType,
      ...(hasVariations && {
        variations: variants.map((v) => ({
          price: Number(v.getPrice()),
          available_quantity: v.getStock(),
          attribute_combinations: v.getAttributes().map((a) => ({
            id: a.name.toUpperCase(),
            value_name: a.value,
          })),
        })),
      }),
    };

    const created = await this.mlClient.createItem(mlItem);
    this.logger.log(`Product ${cmd.productId} published to ML → ${created.id}`);

    // Persist mlItemId on product
    await this.prisma.product.update({
      where: { id: cmd.productId },
      data: { mlItemId: created.id },
    });

    // Persist mlVariationId on variants if ML returned them
    if (hasVariations && (created as any).variations) {
      for (let i = 0; i < variants.length; i++) {
        const mlVar = (created as any).variations?.[i];
        if (mlVar?.id) {
          await this.prisma.productVariant.update({
            where: { id: variants[i].getId() },
            data: { mlVariationId: String(mlVar.id) },
          });
        }
      }
    }

    return created.id;
  }
}
