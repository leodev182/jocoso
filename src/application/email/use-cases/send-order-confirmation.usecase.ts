import { Injectable, Inject } from '@nestjs/common';
import { IEmailService, EMAIL_SERVICE, OrderConfirmationEmailData } from '../ports/email.port';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';
import { IProductVariantRepository, PRODUCT_VARIANT_REPOSITORY } from '../../../domain/products/repositories/product-variant.repository';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../../domain/products/repositories/product.repository';
import { OrderItemProps } from '../../../domain/orders/entities/order.entity';

export interface SendOrderConfirmationInput {
  orderId: string;
  userId: string;
  totalAmount: number;
  items: OrderItemProps[];
  createdAt: Date;
  paymentOrigin?: OrderConfirmationEmailData['paymentOrigin'];
}

@Injectable()
export class SendOrderConfirmationUseCase {
  constructor(
    @Inject(EMAIL_SERVICE) private readonly email: IEmailService,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variantRepo: IProductVariantRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
  ) {}

  async execute(input: SendOrderConfirmationInput): Promise<void> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) return;

    const enrichedItems = await Promise.all(
      input.items.map(async (item) => {
        const variant = await this.variantRepo.findById(item.variantId);
        const product = variant ? await this.productRepo.findById(variant.getProductId()) : null;
        return {
          productName: product?.getTitle() ?? null,
          sku: variant?.getSku() ?? item.variantId,
          quantity: item.quantity,
          price: item.price,
        };
      }),
    );

    await this.email.sendOrderConfirmation({
      orderId: input.orderId,
      customerName: user.getName(),
      customerEmail: user.getEmail(),
      items: enrichedItems,
      totalAmount: input.totalAmount,
      createdAt: input.createdAt,
      paymentOrigin: input.paymentOrigin,
    });
  }
}
