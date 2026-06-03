import { IsEnum } from 'class-validator';
import { OrderStatus } from '../../../../domain/orders/entities/order.entity';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
