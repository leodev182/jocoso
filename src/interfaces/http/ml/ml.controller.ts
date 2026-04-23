import {
  Controller, Get, Post, Query, Body, Param,
  Redirect, HttpCode, HttpStatus, UseGuards, Logger,
} from '@nestjs/common';
import { MlAuthService } from '../../../integrations/mercadolibre/ml-auth.service';
import { HandleMlOrderUseCase } from '../../../application/ml/use-cases/handle-ml-order.usecase';
import { SyncProductToMlUseCase } from '../../../application/ml/use-cases/sync-product-to-ml.usecase';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { RolesGuard } from '../../../infrastructure/security/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../../domain/auth/entities/user.entity';
import { MlWebhookDto } from './dto/ml-webhook.dto';
import { SyncProductDto } from './dto/sync-product.dto';

@Controller('ml')
export class MlController {
  private readonly logger = new Logger(MlController.name);

  constructor(
    private readonly mlAuth: MlAuthService,
    private readonly handleMlOrder: HandleMlOrderUseCase,
    private readonly syncProduct: SyncProductToMlUseCase,
  ) {}

  // ─── OAuth2 ────────────────────────────────────────────────────────────────

  @Get('oauth/authorize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Redirect()
  authorize() {
    const url = this.mlAuth.getAuthorizeUrl();
    return { url };
  }

  @Get('oauth/callback')
  async callback(@Query('code') code: string) {
    const tokens = await this.mlAuth.exchangeCode(code);
    return { message: 'ML connected successfully', sellerId: tokens.sellerId };
  }

  // ─── Webhooks ──────────────────────────────────────────────────────────────

  @Post('webhooks')
  @HttpCode(HttpStatus.OK)
  async webhook(@Body() dto: MlWebhookDto) {
    this.logger.log(`ML webhook: topic=${dto.topic} resource=${dto.resource}`);

    if (dto.topic === 'orders_v2') {
      const mlOrderId = dto.resource.split('/').pop();
      if (mlOrderId) {
        await this.handleMlOrder.execute(mlOrderId).catch((err) =>
          this.logger.error(`Failed processing ML order ${mlOrderId}: ${err.message}`),
        );
      }
    }

    return { received: true };
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
}
