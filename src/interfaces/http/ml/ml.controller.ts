import {
  Controller, Get, Post, Delete, Query, Body, Param,
  HttpCode, HttpStatus, UseGuards, Logger, Redirect,
  ValidationPipe,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { MlAuthService } from '../../../integrations/mercadolibre/ml-auth.service';
import { ML_ORDER_QUEUE } from '../../../infrastructure/queue/ml-order.processor';
import { SyncProductToMlUseCase } from '../../../application/ml/use-cases/sync-product-to-ml.usecase';
import { PullMlImagesUseCase } from '../../../application/ml/use-cases/pull-ml-images.usecase';
import { LinkProductToMlUseCase } from '../../../application/ml/use-cases/link-product-to-ml.usecase';
import { UnlinkProductFromMlUseCase } from '../../../application/ml/use-cases/unlink-product-from-ml.usecase';
import { LinkVariantToMlUseCase } from '../../../application/ml/use-cases/link-variant-to-ml.usecase';
import { MlClient } from '../../../integrations/mercadolibre/ml.client';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { RolesGuard } from '../../../infrastructure/security/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../../domain/auth/entities/user.entity';
import { MlWebhookDto } from './dto/ml-webhook.dto';
import { SyncProductDto } from './dto/sync-product.dto';
import { LinkProductDto } from './dto/link-product.dto';
import { LinkVariantDto } from './dto/link-variant.dto';
import { ReconcileMlOrdersDto } from './dto/reconcile-ml-orders.dto';
import { ReconcileMlOrdersUseCase } from '../../../application/ml/use-cases/reconcile-ml-orders.usecase';
import { ML_STOCK_SYNC_QUEUE } from '../../../infrastructure/queue/ml-stock-sync.processor';

@Controller('ml')
export class MlController {
  private readonly logger = new Logger(MlController.name);

  constructor(
    private readonly mlAuth: MlAuthService,
    private readonly mlClient: MlClient,
    @InjectQueue(ML_ORDER_QUEUE) private readonly mlOrderQueue: Queue,
    @InjectQueue(ML_STOCK_SYNC_QUEUE) private readonly mlStockQueue: Queue,
    private readonly syncProduct: SyncProductToMlUseCase,
    private readonly pullImages: PullMlImagesUseCase,
    private readonly linkProduct: LinkProductToMlUseCase,
    private readonly unlinkProduct: UnlinkProductFromMlUseCase,
    private readonly linkVariant: LinkVariantToMlUseCase,
    private readonly reconcile: ReconcileMlOrdersUseCase,
    private readonly config: ConfigService,
  ) {}

  // ─── OAuth2 ────────────────────────────────────────────────────────────────

  @Get('oauth/authorize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  authorize() {
    const url = this.mlAuth.getAuthorizeUrl();
    return { url };
  }

  @Get('oauth/callback')
  @Redirect()
  async callback(@Query('code') code: string) {
    const tokens = await this.mlAuth.exchangeCode(code);
    const opsUrl = this.config.get('OPS_URL', 'https://ops.jocoso.cl');
    return { url: `${opsUrl}/mercadolibre?connected=true&sellerId=${tokens.sellerId}` };
  }

  // ─── Webhooks ──────────────────────────────────────────────────────────────

  @Post('webhooks')
  @SkipThrottle() // MercadoLibre llama este endpoint — no limitar IPs externas de su infraestructura
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }))
    dto: MlWebhookDto,
  ) {
    this.logger.log(`ML webhook: topic=${dto.topic} resource=${dto.resource}`);

    if (dto.topic === 'orders_v2') {
      const mlOrderId = dto.resource.split('/').pop();
      if (mlOrderId) {
        await this.mlOrderQueue.add(
          'process-order',
          { mlOrderId },
          {
            jobId: `ml-order-${mlOrderId}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
            removeOnFail: 50,
          },
        );
        this.logger.log(`ML order ${mlOrderId} enqueued`);
      }
    }

    if (dto.topic === 'items' || dto.topic === 'stock') {
      const match = dto.resource.match(/\/items\/([^/?]+)/);
      const mlItemId = match?.[1];
      if (mlItemId) {
        await this.mlStockQueue.add(
          'sync-item-stock',
          { mlItemId },
          {
            jobId: `ml-stock-${mlItemId}`,
            delay: 10000,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
            removeOnFail: 50,
          },
        );
        this.logger.log(`ML item ${mlItemId} stock sync enqueued`);
      }
    }

    return { received: true };
  }

  // ─── Admin: search seller items ───────────────────────────────────────────

  @Get('items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async searchItems(@Query('search') search: string) {
    const items = await this.mlClient.searchSellerItems(search ?? '');
    return { items };
  }

  // ─── Admin: link product to existing ML item ───────────────────────────────

  @Post('products/:productId/link')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async linkProductToMl(
    @Param('productId') productId: string,
    @Body() dto: LinkProductDto,
  ) {
    await this.linkProduct.execute({ productId, ...dto });
  }

  @Get('items/:mlItemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getItem(@Param('mlItemId') mlItemId: string) {
    return this.mlClient.getItemDetail(mlItemId);
  }

  @Post('products/:productId/variants/:variantId/link')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async linkVariantToMl(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: LinkVariantDto,
  ) {
    await this.linkVariant.execute(productId, variantId, dto.mlVariationId);
  }

  @Delete('products/:productId/link')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlinkProductFromMl(@Param('productId') productId: string) {
    await this.unlinkProduct.execute(productId);
  }

  // ─── Admin: sync product ───────────────────────────────────────────────────

  @Post('products/:productId/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async syncProductToMl(
    @Param('productId') productId: string,
    @Body() dto: SyncProductDto,
  ) {
    const mlItemId = await this.syncProduct.execute({ productId, ...dto });
    return { mlItemId };
  }

  @Post('products/:productId/pull-images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async pullProductImages(@Param('productId') productId: string) {
    const images = await this.pullImages.execute(productId);
    return { images };
  }

  // ─── Reconciliación de órdenes ────────────────────────────────────────────

  @Post('reconcile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async reconcileOrders(@Body() dto: ReconcileMlOrdersDto) {
    const since = new Date(dto.since);
    const result = await this.reconcile.execute(since);
    return result;
  }
}
