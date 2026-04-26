import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe, ValidationPipe } from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';
import { DecreaseStockUseCase } from '../../../application/stock/use-cases/decrease-stock.usecase';
import { IncreaseStockUseCase } from '../../../application/stock/use-cases/increase-stock.usecase';
import { GetStockUseCase } from '../../../application/stock/use-cases/get-stock.usecase';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { RolesGuard } from '../../../infrastructure/security/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DecreaseStockDto } from './dto/decrease-stock.dto';
import { IncreaseStockDto } from './dto/increase-stock.dto';

@Controller('stock')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockController {
  constructor(
    private readonly decrease: DecreaseStockUseCase,
    private readonly increase: IncreaseStockUseCase,
    private readonly getStock: GetStockUseCase,
  ) {}

  @Get(':variantId')
  @Roles('ADMIN', 'SUPPORT')
  getByVariant(@Param('variantId', ParseUUIDPipe) variantId: string) {
    return this.getStock.getStock(variantId);
  }

  @Get(':variantId/movements')
  @Roles('ADMIN', 'SUPPORT')
  getMovements(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) pagination?: PaginationDto,
  ) {
    return this.getStock.getMovements(variantId, pagination?.page, pagination?.limit);
  }

  @Post('decrease')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  handleDecrease(@Body() dto: DecreaseStockDto) {
    return this.decrease.execute(dto);
  }

  @Post('increase')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  handleIncrease(@Body() dto: IncreaseStockDto) {
    return this.increase.execute(dto);
  }
}
