import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Order } from '../../../domain/orders/entities/order.entity';
import { IOrderRepository, ORDER_REPOSITORY } from '../../../domain/orders/repositories/order.repository';
import { OrderDomainService } from '../../../domain/orders/services/order.domain.service';
import { IProductVariantRepository, PRODUCT_VARIANT_REPOSITORY } from '../../../domain/products/repositories/product-variant.repository';

export interface CreateOrderItem { variantId: string; quantity: number; }
export interface CreateOrderCommand { userId: string; items: CreateOrderItem[]; }

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variantRepo: IProductVariantRepository,
    private readonly orderDomain: OrderDomainService,
  ) {}

  async execute(cmd: CreateOrderCommand): Promise<Order> {
    const resolvedItems = await Promise.all(
      cmd.items.map(async (item) => {
        const variant = await this.variantRepo.findById(item.variantId);
        if (!variant) throw new NotFoundException(`Variant ${item.variantId} not found`);
        return { variantId: item.variantId, quantity: item.quantity, price: variant.getPrice() };
      }),
    );

    this.orderDomain.validateItems(resolvedItems);

    const order = Order.create(cmd.userId, resolvedItems);
    await this.orderRepo.save(order);
    return order;
  }
}
