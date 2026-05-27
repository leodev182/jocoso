import { Module } from '@nestjs/common';
import { ShipmentsController } from '../../interfaces/http/shipments/shipments.controller';
import { ZplLabelService } from '../../application/orders/services/zpl-label.service';

@Module({
  controllers: [ShipmentsController],
  providers: [ZplLabelService],
})
export class ShipmentsModule {}
