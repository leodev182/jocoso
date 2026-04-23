import { Injectable, Inject, Logger } from '@nestjs/common';
import { IProductViewRepository, PRODUCT_VIEW_REPOSITORY } from '../../../domain/products/repositories/product-view.repository';

@Injectable()
export class TrackProductViewUseCase {
  private readonly logger = new Logger(TrackProductViewUseCase.name);

  constructor(
    @Inject(PRODUCT_VIEW_REPOSITORY) private readonly viewRepo: IProductViewRepository,
  ) {}

  // Fire-and-forget — never throws, never blocks the main response
  track(productId: string, userId?: string): void {
    this.viewRepo.record(productId, userId).catch((err) =>
      this.logger.error(`Failed to track view for product ${productId}: ${err.message}`),
    );
  }
}
