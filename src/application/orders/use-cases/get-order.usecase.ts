import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IOrderRepository, ORDER_REPOSITORY } from '../../../domain/orders/repositories/order.repository';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';
import { IProductVariantRepository, PRODUCT_VARIANT_REPOSITORY } from '../../../domain/products/repositories/product-variant.repository';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../../domain/products/repositories/product.repository';
import { Order } from '../../../domain/orders/entities/order.entity';

@Injectable()
export class GetOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variantRepo: IProductVariantRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
  ) {}

  // Datos del comprador para mostrar en ops (nombre o email, no el id crudo)
  private async userInfo(userId: string) {
    const u = await this.userRepo.findById(userId);
    return u ? { id: u.getId(), name: u.getName(), email: u.getEmail() } : null;
  }

  // Resuelve el nombre del producto + SKU de cada item (los items solo guardan variantId)
  private async enrichItems(items: { variantId: string }[]) {
    return Promise.all(
      items.map(async (it: any) => {
        const variant = await this.variantRepo.findById(it.variantId);
        let productName: string | null = null;
        let sku: string | null = null;
        if (variant) {
          sku = variant.getSku();
          const product = await this.productRepo.findById(variant.getProductId());
          productName = product?.getTitle() ?? null;
        }
        return { ...it, productName, sku };
      }),
    );
  }

  private async withUser(order: Order) {
    const data = order.toPersistence();
    return { ...data, user: await this.userInfo(data.userId) };
  }

  async getById(id: string, requestingUserId: string, role: string) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    if (order.getUserId() !== requestingUserId && role !== 'ADMIN' && role !== 'SUPPORT') {
      throw new ForbiddenException();
    }
    const data = order.toPersistence();
    return {
      ...data,
      user: await this.userInfo(data.userId),
      items: await this.enrichItems(data.items),
    };
  }

  async getByUser(userId: string, page = 1, limit = 20) {
    const { orders, total } = await this.orderRepo.findByUserId(userId, page, limit);
    const data = await Promise.all(orders.map((o) => this.withUser(o)));
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async listAll(status?: string, page = 1, limit = 20) {
    const { orders, total } = await this.orderRepo.findAll(status, page, limit);
    const data = await Promise.all(orders.map((o) => this.withUser(o)));
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
