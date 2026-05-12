import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { MlClient } from '../../../integrations/mercadolibre/ml.client';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../../domain/products/repositories/product.repository';

@Injectable()
export class PullMlImagesUseCase {
  private readonly logger = new Logger(PullMlImagesUseCase.name);

  constructor(
    private readonly mlClient: MlClient,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
  ) {}

  async execute(productId: string): Promise<string[]> {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException(`Product ${productId} not found`);
    if (!product.getMlItemId()) throw new BadRequestException('Product is not synced to MercadoLibre yet');

    const mlItem = await this.mlClient.getItem(product.getMlItemId()!);
    const images = mlItem.pictures?.map((p) => p.secure_url).filter(Boolean) ?? [];

    product.setImages(images);
    await this.productRepo.update(product);

    this.logger.log(`Product ${productId}: pulled ${images.length} image(s) from ML`);
    return images;
  }
}
