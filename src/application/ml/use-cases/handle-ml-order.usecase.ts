import { Injectable, Inject, Logger } from '@nestjs/common';
import { MlClient } from '../../../integrations/mercadolibre/ml.client';
import { IProductVariantRepository, PRODUCT_VARIANT_REPOSITORY } from '../../../domain/products/repositories/product-variant.repository';
import { IOrderRepository, ORDER_REPOSITORY } from '../../../domain/orders/repositories/order.repository';
import { DecreaseStockUseCase } from '../../stock/use-cases/decrease-stock.usecase';
import { Order } from '../../../domain/orders/entities/order.entity';
import { StockSource, ReferenceType } from '../../../domain/stock/entities/stock-movement.entity';

@Injectable()
export class HandleMlOrderUseCase {
  private readonly logger = new Logger(HandleMlOrderUseCase.name);

  constructor(
    private readonly mlClient: MlClient,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variantRepo: IProductVariantRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    private readonly decreaseStock: DecreaseStockUseCase,
  ) {}

  async execute(mlOrderId: string): Promise<void> {
    const externalId = `ml-order-${mlOrderId}`;

    const mlOrder = await this.mlClient.getOrder(mlOrderId);

    if (mlOrder.status !== 'paid') {
      this.logger.log(`ML order ${mlOrderId} status=${mlOrder.status} — skipping`);
      return;
    }

    const items: { variantId: string; quantity: number; price: number }[] = [];

    for (const item of mlOrder.order_items) {
      const mlVariationId = String(item.item.variation_id ?? item.item.id);
      const variant = await this.variantRepo.findByMlVariationId(mlVariationId);

      if (!variant) {
        this.logger.warn(`No variant found for mlVariationId=${mlVariationId} — skipping item`);
        continue;
      }

      items.push({
        variantId: variant.getId(),
        quantity: item.quantity,
        price: Number(item.unit_price),
      });
    }

    if (!items.length) {
      this.logger.warn(`ML order ${mlOrderId} has no mappable items`);
      return;
    }

    // Create internal order
    const order = Order.create(String(mlOrder.buyer.id), items);
    order.confirm();
    await this.orderRepo.save(order);

    // Decrease stock atomically per item
    for (const item of items) {
      await this.decreaseStock.execute({
        variantId: item.variantId,
        quantity: item.quantity,
        source: StockSource.ML,
        referenceType: ReferenceType.ML_SALE,
        referenceId: order.getId(),
        externalId: `${externalId}-${item.variantId}`,
      });
    }

    this.logger.log(`ML order ${mlOrderId} processed → internal order ${order.getId()}`);
  }
}
