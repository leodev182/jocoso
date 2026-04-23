import { IsString, IsNumber, IsOptional } from 'class-validator';

export class MlWebhookDto {
  @IsString()
  resource: string;

  @IsString()
  topic: string;

  @IsNumber()
  user_id: number;

  @IsOptional()
  @IsString()
  attempts?: string;
}
