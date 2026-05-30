import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { CreateProductUseCase } from '../../../application/products/use-cases/create-product.usecase';
import { CreateVariantUseCase } from '../../../application/products/use-cases/create-variant.usecase';
import { GetProductUseCase } from '../../../application/products/use-cases/get-product.usecase';
import { TrackProductViewUseCase } from '../../../application/products/use-cases/track-product-view.usecase';
import { GetTrendingProductsUseCase } from '../../../application/products/use-cases/get-trending-products.usecase';
import { DeleteProductUseCase } from '../../../application/products/use-cases/delete-product.usecase';
import { DeleteVariantUseCase } from '../../../application/products/use-cases/delete-variant.usecase';
import { UpdateVariantUseCase } from '../../../application/products/use-cases/update-variant.usecase';
import { UpdateProductUseCase } from '../../../application/products/use-cases/update-product.usecase';
import { AddTagToProductUseCase } from '../../../application/products/use-cases/add-tag-to-product.usecase';
import { RemoveTagFromProductUseCase } from '../../../application/products/use-cases/remove-tag-from-product.usecase';
import { ListStorefrontProductsUseCase } from '../../../application/products/use-cases/list-storefront-products.usecase';
import { ListStorefrontQueryDto } from './dto/list-storefront-query.dto';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { RolesGuard } from '../../../infrastructure/security/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { UpdateProductDto } from './dto/update-product.dto';
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
    private readonly deleteProduct: DeleteProductUseCase,
    private readonly deleteVariant: DeleteVariantUseCase,
    private readonly updateVariant: UpdateVariantUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly addTag: AddTagToProductUseCase,
    private readonly removeTag: RemoveTagFromProductUseCase,
    private readonly listStorefront: ListStorefrontProductsUseCase,
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

  @Get('storefront')
  getStorefront(@Query() query: ListStorefrontQueryDto) {
    return this.listStorefront.execute({
      featured: query.featured,
      tagSlug: query.tag,
      search: query.search,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.updateProduct.execute({ id, ...dto });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.deleteProduct.execute(id);
  }

  @Post(':id/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  addVariant(@Param('id', ParseUUIDPipe) productId: string, @Body() dto: CreateVariantDto) {
    return this.createVariant.execute({ productId, ...dto });
  }

  @Patch(':id/variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  editVariant(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.updateVariant.execute({ variantId, price: dto.price, attributes: dto.attributes as any });
  }

  @Delete(':id/variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeVariant(@Param('variantId', ParseUUIDPipe) variantId: string) {
    return this.deleteVariant.execute(variantId);
  }

  @Post(':id/tags/:tagId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  addTagToProduct(
    @Param('id', ParseUUIDPipe) productId: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
  ) {
    return this.addTag.execute(productId, tagId);
  }

  @Delete(':id/tags/:tagId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTagFromProduct(
    @Param('id', ParseUUIDPipe) productId: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
  ) {
    return this.removeTag.execute(productId, tagId);
  }
}
