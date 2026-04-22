import { IsString, IsIn } from 'class-validator';

export class WebhookDto {
  @IsString()
  paymentId: string;

  @IsString()
  gatewayId: string;

  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';
}
