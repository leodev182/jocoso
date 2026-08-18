import { Transform } from 'class-transformer';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class MlWebhookDto {
  @IsString()
  resource: string;

  @IsString()
  topic: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? value : Number(value)))
  @IsNumber()
  user_id?: number;

  @IsOptional()
  @IsNumber()
  attempts?: number;
}
