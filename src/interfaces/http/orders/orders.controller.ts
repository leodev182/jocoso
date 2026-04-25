import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { CreateOrderUseCase } from '../../../application/orders/use-cases/create-order.usecase';
import { GetOrderUseCase } from '../../../application/orders/use-cases/get-order.usecase';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { RolesGuard } from '../../../infrastructure/security/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { Role } from '../../../domain/auth/entities/user.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly getOrder: GetOrderUseCase,
  ) {}

  // Admin: lista todas las órdenes
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT)
  listAll(@Query('status') status?: string) {
    return this.getOrder.listAll(status);
  }

  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: { id: string }) {
    return this.createOrder.execute({ userId: user.id, items: dto.items });
  }

  @Get('my')
  getMyOrders(@CurrentUser() user: { id: string }) {
    return this.getOrder.getByUser(user.id);
  }

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.getOrder.getById(id, user.id, user.role);
  }
}
