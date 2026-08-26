import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';
import { IOrderRepository, ORDER_REPOSITORY } from '../../../domain/orders/repositories/order.repository';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '../../../domain/payments/repositories/payment.repository';
import { IProductVariantRepository, PRODUCT_VARIANT_REPOSITORY } from '../../../domain/products/repositories/product-variant.repository';
import { Order, OrderOrigin } from '../../../domain/orders/entities/order.entity';
import { Payment } from '../../../domain/payments/entities/payment.entity';
import { DecreaseStockUseCase } from '../../stock/use-cases/decrease-stock.usecase';
import { StockSource, ReferenceType } from '../../../domain/stock/entities/stock-movement.entity';
import { SendOrderConfirmationUseCase } from '../../email/use-cases/send-order-confirmation.usecase';

export interface ManualOrderItem { variantId: string; quantity: number; }

export type ManualOrderOrigin = 'CARD' | 'TRANSFER' | 'CASH';

export interface CreateManualOrderCommand {
  userId: string;
  items: ManualOrderItem[];
  origin: ManualOrderOrigin;
  adminNotes?: string;
}

@Injectable()
export class CreateManualOrderUseCase {
  private readonly logger = new Logger(CreateManualOrderUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variantRepo: IProductVariantRepository,
    private readonly decreaseStock: DecreaseStockUseCase,
    private readonly sendConfirmation: SendOrderConfirmationUseCase,
  ) {}

  async execute(cmd: CreateManualOrderCommand): Promise<{ orderId: string; totalAmount: number }> {
    const user = await this.userRepo.findById(cmd.userId);
    if (!user) throw new NotFoundException(`Cliente ${cmd.userId} no encontrado`);
    if (!user.getIsActive()) throw new BadRequestException('El cliente está desactivado');

    const resolvedItems = await Promise.all(
      cmd.items.map(async (item) => {
        const variant = await this.variantRepo.findById(item.variantId);
        if (!variant) throw new NotFoundException(`Variante ${item.variantId} no encontrada`);
        return { variantId: item.variantId, quantity: item.quantity, price: variant.getPrice() };
      }),
    );

    if (resolvedItems.length === 0) throw new BadRequestException('La orden debe tener al menos un ítem');

    const origin = OrderOrigin[cmd.origin];
    const order = Order.create(cmd.userId, resolvedItems, null, origin);
    order.confirm();

    await this.orderRepo.save(order);

    const payment = Payment.create(order.getId(), order.getTotalAmount());
    payment.approve('manual');
    await this.paymentRepo.save(payment);

    for (const item of order.getItems()) {
      await this.decreaseStock.execute({
        variantId: item.variantId,
        quantity: item.quantity,
        source: StockSource.ADMIN,
        referenceType: ReferenceType.ORDER,
        referenceId: order.getId(),
        externalId: `manual-${order.getId()}-${item.variantId}`,
      });
    }

    this.sendConfirmation
      .execute({
        orderId: order.getId(),
        userId: cmd.userId,
        totalAmount: order.getTotalAmount(),
        items: order.getItems(),
        createdAt: order.toPersistence().createdAt,
        paymentOrigin: cmd.origin,
      })
      .catch((err) => this.logger.error(`Email fallo para orden manual ${order.getId()}: ${err?.message}`));

    return { orderId: order.getId(), totalAmount: order.getTotalAmount() };
  }
}
