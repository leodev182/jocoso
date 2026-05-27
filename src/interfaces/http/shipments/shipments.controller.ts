import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { RolesGuard } from '../../../infrastructure/security/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../../domain/auth/entities/user.entity';
import { ZplLabelService } from '../../../application/orders/services/zpl-label.service';
import { GenerateLabelDto } from './dto/generate-label.dto';
import * as crypto from 'crypto';

@Controller('shipments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ShipmentsController {
  constructor(private readonly zplLabel: ZplLabelService) {}

  @Post('label')
  generateLabel(@Body() dto: GenerateLabelDto): { zpl: string } {
    const address = {
      id: crypto.randomUUID(),
      userId: '',
      alias: '',
      fullName: dto.fullName,
      rut: dto.rut,
      email: dto.email ?? null,
      phone: dto.phone,
      region: dto.region,
      ciudad: dto.ciudad,
      comuna: dto.comuna,
      calle: dto.calle,
      numero: dto.numero,
      depto: dto.depto ?? null,
      referencia: dto.referencia ?? null,
      isDefault: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const zpl = this.zplLabel.generate(
      crypto.randomUUID(),
      dto.trackingCode ?? null,
      address,
      dto.itemCount,
      dto.total,
    );

    return { zpl };
  }
}
