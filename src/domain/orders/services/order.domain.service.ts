import { UnprocessableEntityException } from '@nestjs/common';

export class OrderDomainService {
  validateItems(items: { variantId: string; quantity: number; price: number }[]): void {
    if (!items.length) throw new UnprocessableEntityException('Order must have at least one item');
    for (const item of items) {
      if (item.quantity <= 0) throw new UnprocessableEntityException('Item quantity must be positive');
      if (item.price <= 0) throw new UnprocessableEntityException('Item price must be positive');
    }
  }
}
