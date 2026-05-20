import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IOrderRepository, ORDER_REPOSITORY } from '../../../domain/orders/repositories/order.repository';
import { IAddressRepository, ADDRESS_REPOSITORY } from '../../../domain/auth/repositories/address.repository';
import { ZplLabelService } from '../services/zpl-label.service';

function generateTrackingCode(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `JCS${date}${rand}`;
}

@Injectable()
export class GenerateShippingLabelUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    @Inject(ADDRESS_REPOSITORY) private readonly addressRepo: IAddressRepository,
    private readonly zplService: ZplLabelService,
  ) {}

  async execute(orderId: string): Promise<{ trackingCode: string; zpl: string }> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const addressId = order.getAddressId();
    if (!addressId) throw new BadRequestException('La orden no tiene dirección de despacho asignada');

    const address = await this.addressRepo.findById(addressId);
    if (!address) throw new NotFoundException('Dirección de despacho no encontrada');

    const trackingCode = order.getTrackingCode() ?? generateTrackingCode();
    const zpl = this.zplService.generate(
      orderId,
      trackingCode,
      address.toPersistence(),
      order.getItems().length,
      order.getTotalAmount(),
    );

    order.setShippingLabel(trackingCode, zpl);
    await this.orderRepo.update(order);

    return { trackingCode, zpl };
  }
}
