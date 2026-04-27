import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe, Request } from '@nestjs/common';
import { CreateProductUseCase } from '../../../application/products/use-cases/create-product.usecase';
import { CreateVariantUseCase } from '../../../application/products/use-cases/create-variant.usecase';
import { GetProductUseCase } from '../../../application/products/use-cases/get-product.usecase';
import { TrackProductViewUseCase } from '../../../application/products/use-cases/track-product-view.usecase';
import { GetTrendingProductsUseCase } from '../../../application/products/use-cases/get-trending-products.usecase';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { RolesGuard } from '../../../infrastructure/security/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { Role } from '../../../domain/auth/entities/user.entity';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly createVariant: CreateVariantUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly trackView: TrackProductViewUseCase,
    private readonly getTrending: GetTrendingProductsUseCase,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT)
  list(@Query() query: ListProductsQueryDto) {
    return this.getProduct.listAll(query.status, query.page, query.limit, query.search);
  }

  @Get('trending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT)
  trending(
    @Query('period') period: string = '7d',
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.getTrending.execute(period, limit);
  }

  // Public endpoint — any authenticated user can view a product
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getById(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    this.trackView.track(id, req.user?.id);
    return this.getProduct.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateProductDto) {
    return this.createProduct.execute(dto);
  }

  @Post(':id/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  addVariant(@Param('id', ParseUUIDPipe) productId: string, @Body() dto: CreateVariantDto) {
    return this.createVariant.execute({ productId, ...dto });
  }
}
