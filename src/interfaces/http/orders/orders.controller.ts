import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, ParseUUIDPipe, ValidationPipe,
} from '@nestjs/common';
import { Audit } from '../../../infrastructure/audit/audit.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateOrderUseCase } from '../../../application/orders/use-cases/create-order.usecase';
import { GetOrderUseCase } from '../../../application/orders/use-cases/get-order.usecase';
import { UpdateOrderStatusUseCase } from '../../../application/orders/use-cases/update-order-status.usecase';
import { DeleteOrderUseCase } from '../../../application/orders/use-cases/delete-order.usecase';
import { GenerateShippingLabelUseCase } from '../../../application/orders/use-cases/generate-shipping-label.usecase';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { RolesGuard } from '../../../infrastructure/security/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Role } from '../../../domain/auth/entities/user.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly getOrder: GetOrderUseCase,
    private readonly updateStatus: UpdateOrderStatusUseCase,
    private readonly deleteOrder: DeleteOrderUseCase,
    private readonly generateLabel: GenerateShippingLabelUseCase,
  ) {}

  // Admin: lista todas las órdenes
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT)
  listAll(
    @Query('status') status?: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) pagination?: PaginationDto,
  ) {
    return this.getOrder.listAll(status, pagination?.page, pagination?.limit);
  }

  @Post()
  @Audit({ action: 'ORDER_CREATE', resource: 'orders' })
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: { id: string }) {
    return this.createOrder.execute({ userId: user.id, items: dto.items, addressId: dto.addressId });
  }

  @Get('my')
  getMyOrders(
    @CurrentUser() user: { id: string },
    @Query(new ValidationPipe({ transform: true, whitelist: true })) pagination?: PaginationDto,
  ) {
    return this.getOrder.getByUser(user.id, pagination?.page, pagination?.limit);
  }

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.getOrder.getById(id, user.id, user.role);
  }

  // Admin: cambiar estado de la orden (Pago confirmado, En camino, Entregado, Cancelado)
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT)
  @Audit({ action: 'ORDER_STATUS_CHANGE', resource: 'orders' })
  updateOrderStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.updateStatus.execute(id, dto.status);
  }

  // Admin: eliminar la orden (borra payment + logs + items)
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Audit({ action: 'ORDER_DELETE', resource: 'orders' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.deleteOrder.execute(id);
  }

  @Post(':id/shipping-label')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT)
  generateShippingLabel(@Param('id', ParseUUIDPipe) id: string) {
    return this.generateLabel.execute(id);
  }
}
