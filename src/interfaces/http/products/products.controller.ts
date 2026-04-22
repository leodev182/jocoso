import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { CreateProductUseCase } from '../../../application/products/use-cases/create-product.usecase';
import { CreateVariantUseCase } from '../../../application/products/use-cases/create-variant.usecase';
import { GetProductUseCase } from '../../../application/products/use-cases/get-product.usecase';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { RolesGuard } from '../../../infrastructure/security/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly createVariant: CreateVariantUseCase,
    private readonly getProduct: GetProductUseCase,
  ) {}

  @Get()
  @Roles('ADMIN', 'SUPPORT')
  list(@Query('status') status?: string) {
    return this.getProduct.listAll(status);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPPORT')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.getProduct.getById(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateProductDto) {
    return this.createProduct.execute(dto);
  }

  @Post(':id/variants')
  @Roles('ADMIN')
  addVariant(@Param('id', ParseUUIDPipe) productId: string, @Body() dto: CreateVariantDto) {
    return this.createVariant.execute({ productId, ...dto });
  }
}
